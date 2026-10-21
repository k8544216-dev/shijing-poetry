/* Lifecycle adapter only. Particle simulation, shaders and camera are upstream. */
(() => {
  'use strict';
  const channel = 'poetry-flow/v1';
  const root = document.documentElement;
  const origin = location.origin;
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const nativeTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const callbacks = new Map();
  const timers = new Set();
  const intervals = new Set();
  const contexts = new Set();
  let nextId = 1;
  let paused = document.hidden;
  let disposed = false;
  let initialized = false;
  let painted = false;
  let renderFailed = false;
  let drew = false;
  let insideRAF = false;
  let commitQueued = false;
  let frames = 0;
  let internalFocus = false;

  function send(type, extra = {}) {
    if (!disposed && window.parent !== window) window.parent.postMessage({channel, type, ...extra}, origin);
  }
  function commitFrame() {
    if (disposed || renderFailed || !drew) return;
    drew = false;
    root.dataset.renderFrames = String(++frames);
    if (initialized && !painted) {
      painted = true;
      root.dataset.painted = 'true';
      send('painted');
    }
    if (frames % 15 === 0 || frames === 1) send('frame', {frames});
  }
  function recordDraw() {
    if (disposed || renderFailed) return;
    drew = true;
    if (!insideRAF && !commitQueued) {
      commitQueued = true;
      queueMicrotask(() => {commitQueued = false; commitFrame();});
    }
  }
  function schedule(id, entry) {
    if (paused || disposed || entry.nativeId !== null) return;
    entry.nativeId = nativeRAF(time => {
      callbacks.delete(id);
      root.dataset.pendingFrames = String(callbacks.size);
      if (disposed || paused) return;
      insideRAF = true;
      try {entry.callback(time);} finally {insideRAF = false; commitFrame();}
    });
  }
  window.requestAnimationFrame = callback => {
    if (disposed) return 0;
    const id = nextId++;
    const entry = {callback, nativeId:null};
    callbacks.set(id, entry);
    root.dataset.pendingFrames = String(callbacks.size);
    schedule(id, entry);
    return id;
  };
  window.cancelAnimationFrame = id => {
    const entry = callbacks.get(id);
    if (entry?.nativeId !== null && entry?.nativeId !== undefined) nativeCancel(entry.nativeId);
    callbacks.delete(id);
    root.dataset.pendingFrames = String(callbacks.size);
  };
  window.setTimeout = (callback, delay, ...args) => {
    if (disposed) return 0;
    const id = nativeTimeout(() => {
      timers.delete(id);
      if (!disposed && typeof callback === 'function') callback(...args);
    }, delay);
    timers.add(id);
    return id;
  };
  window.clearTimeout = id => {timers.delete(id); nativeClearTimeout(id);};
  window.setInterval = (callback, delay, ...args) => {
    if (disposed) return 0;
    const id = nativeInterval(() => {if (!disposed && typeof callback === 'function') callback(...args);}, delay);
    intervals.add(id);
    return id;
  };
  window.clearInterval = id => {intervals.delete(id); nativeClearInterval(id);};

  // The author uses an absolute texture URL. Adapt only this request, leaving
  // every byte of the compiled renderer unchanged, including its visual defaults.
  const imageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {...imageSrc, set(value) {
    const url = new URL(String(value), document.baseURI);
    if (url.origin === origin && url.pathname === '/sketch-threejs/img/sketch/flow_field/noise.jpg') {
      value = new URL('./noise.jpg', document.baseURI).href;
    }
    imageSrc.set.call(this, value);
  }});

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    if (disposed) return null;
    const gl = originalGetContext.call(this, type, ...args);
    if (gl && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') && !contexts.has(gl)) {
      contexts.add(gl);
      // WebGL reports compiler/linker failures through status flags, not JS
      // exceptions. A rejected program must never count as a painted scene.
      const compile = gl.compileShader.bind(gl);
      gl.compileShader = shader => {
        compile(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) renderingError('Flow Field 着色器编译失败。');
      };
      const link = gl.linkProgram.bind(gl);
      gl.linkProgram = program => {
        link(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) renderingError('Flow Field 着色器链接失败。');
      };
      let defaultFramebuffer = true;
      const bind = gl.bindFramebuffer.bind(gl);
      gl.bindFramebuffer = (target, buffer) => {
        if (target === gl.FRAMEBUFFER || target === gl.DRAW_FRAMEBUFFER) defaultFramebuffer = buffer === null;
        return bind(target, buffer);
      };
      for (const method of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']) {
        if (typeof gl[method] !== 'function') continue;
        const draw = gl[method].bind(gl);
        gl[method] = (...params) => {
          const result = draw(...params);
          if (defaultFramebuffer && !renderFailed) {
            if (!painted && (gl.isContextLost() || gl.getError() !== gl.NO_ERROR)) renderingError('Flow Field WebGL 绘制失败。');
            else recordDraw();
          }
          return result;
        };
      }
    }
    return gl;
  };

  function clockEvent(type) {
    internalFocus = true;
    window.dispatchEvent(new Event(type));
    internalFocus = false;
  }
  function setPaused(value) {
    if (disposed) return;
    const next = value || document.hidden || renderFailed;
    if (paused === next) return;
    paused = next;
    root.dataset.paused = String(paused);
    if (paused) {
      clockEvent('blur');
      for (const entry of callbacks.values()) {
        if (entry.nativeId !== null) nativeCancel(entry.nativeId);
        entry.nativeId = null;
      }
    } else {
      clockEvent('focus');
      for (const [id, entry] of callbacks) schedule(id, entry);
    }
  }
  function error(message) {
    if (disposed) return;
    root.dataset.error = String(message);
    send('error', {message:String(message)});
  }
  function renderingError(message) {
    if (disposed || renderFailed) return;
    renderFailed = true;
    drew = false;
    error(message);
    setPaused(true);
  }
  function guardFocus(event) {
    if (!internalFocus && paused) event.stopImmediatePropagation();
  }
  function visibilityChanged() {setPaused(document.hidden || requestedPause);}
  let requestedPause = false;
  function onMessage(event) {
    if (disposed || event.origin !== origin || event.source !== window.parent || event.data?.channel !== channel) return;
    if (event.data.type === 'pause' && typeof event.data.value === 'boolean') {
      requestedPause = event.data.value;
      setPaused(requestedPause);
    } else if (event.data.type === 'dispose') dispose();
  }
  function onError(event) {
    error(event.message || 'Flow Field 资源加载失败。');
  }
  function onRejection(event) {error(event.reason?.message || 'Flow Field 初始化失败。');}
  function onContextLost(event) {
    event.preventDefault();
    renderingError('Flow Field WebGL 上下文已丢失。');
    requestedPause = true;
    setPaused(true);
  }

  // Capture the author's listeners too: anonymous blur/focus/resize hooks must
  // not survive standalone disposal while an asynchronous texture is pending.
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  const listeners = [];
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (disposed) return;
    listeners.push({target:this,type,listener,options});
    return originalAdd.call(this,type,listener,options);
  };
  const preloader = document.querySelector('.p-preloader');
  const observer = new MutationObserver(() => {
    if (disposed || initialized || !preloader.classList.contains('is-hidden')) return;
    if (renderFailed) {clockEvent('blur'); return;}
    initialized = true;
    root.dataset.ready = 'true';
    send('ready');
    if (paused) clockEvent('blur');
    // startup renders synchronously before this observer; painting is counted
    // only by an actual draw on the display framebuffer, never by script load.
    if (frames > 0 && !painted) {
      painted = true;
      root.dataset.painted = 'true';
      send('painted');
    }
  });
  observer.observe(preloader, {attributes:true,attributeFilter:['class']});
  window.addEventListener('focus', guardFocus, true);
  window.addEventListener('message', onMessage);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
  document.addEventListener('visibilitychange', visibilityChanged);
  document.querySelector('#canvas-webgl').addEventListener('webglcontextlost', onContextLost);
  root.dataset.paused = String(paused);
  root.dataset.renderFrames = '0';
  root.dataset.pendingFrames = '0';

  function dispose() {
    if (disposed) return;
    clockEvent('blur');
    disposed = true;
    observer.disconnect();
    for (const entry of callbacks.values()) if (entry.nativeId !== null) nativeCancel(entry.nativeId);
    callbacks.clear();
    for (const id of timers) nativeClearTimeout(id);
    for (const id of intervals) nativeClearInterval(id);
    timers.clear(); intervals.clear();
    for (const item of listeners) originalRemove.call(item.target,item.type,item.listener,item.options);
    listeners.length = 0;
    for (const gl of contexts) gl.getExtension('WEBGL_lose_context')?.loseContext();
    contexts.clear();
    root.dataset.disposed = 'true';
    root.dataset.pendingFrames = '0';
  }
})();
