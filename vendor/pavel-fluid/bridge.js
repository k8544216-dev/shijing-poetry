/* Integration only. The original upstream.js, its GLSL and defaults are unmodified. */
(() => {
  const channel='poetry-fluid/v1';
  let automatic=new URLSearchParams(location.search).get('manual')!=='1';
  let suspended=false, disposed=false, frames=0, simulationTime=0, previous=0, brushClock=0;
  let lastInteraction=-Infinity;
  let animation=0;
  const brushes=[0,2.4,4.9].map(phase=>({phase,x:0,y:0,initialized:false,color:generateColor()}));
  const report=(type,extra={})=>{if(parent!==window)parent.postMessage({channel,type,...extra},location.origin);};
  const engineReady=!!gl && !!dye && !!velocity;

  function setPaused(value) {
    suspended=!!value;
    config.PAUSED=suspended;
    previous=0;
    if(suspended)updatePointerUpData(pointers[0]);
  }
  function paintAutomatic(dt) {
    simulationTime+=dt;
    brushClock+=dt;
    if(brushClock<1/30)return;
    brushClock=0;
    for(const brush of brushes){
      const t=simulationTime,phase=brush.phase;
      const x=.5+.32*Math.sin(t*.29+phase)+.08*Math.sin(t*.67+phase*2);
      const y=.5+.30*Math.cos(t*.37+phase)+.08*Math.sin(t*.79+phase*1.3);
      if(brush.initialized){
        const dx=correctDeltaX(x-brush.x)*config.SPLAT_FORCE;
        const dy=correctDeltaY(y-brush.y)*config.SPLAT_FORCE;
        // Exactly the upstream cursor's 0.15-range dye, splat radius and force.
        // This only supplies virtual mouse motion; no rendering change.
        splat(x,y,dx,dy,brush.color);
      }
      brush.x=x;brush.y=y;brush.initialized=true;
      if(Math.random()<.055)brush.color=generateColor();
    }
  }
  function tick(now){
    if(disposed)return;
    const dt=previous?Math.min((now-previous)/1000,.033):0;
    previous=now;
    if(!suspended&&!document.hidden){
      if(automatic&&!config.PAUSED&&now-lastInteraction>1800)paintAutomatic(dt);
      frames++;
      if(frames%30===0){document.documentElement.dataset.renderFrames=String(frames);report('frame',{frames});}
    }
    animation=requestAnimationFrame(tick);
  }
  canvas.addEventListener('pointerdown',()=>{lastInteraction=performance.now();});
  canvas.addEventListener('pointermove',event=>{if(event.buttons)lastInteraction=performance.now();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setPaused(true);report('error',{message:'流体显卡上下文已丢失，请刷新页面重试。'});});
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.channel!==channel)return;
    if(event.data.type==='pause')setPaused(event.data.value);
    if(event.data.type==='release')updatePointerUpData(pointers[0]);
    if(event.data.type==='automatic')automatic=!!event.data.value;
    if(event.data.type==='dispose'){
      disposed=true;cancelAnimationFrame(animation);config.PAUSED=true;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
  window.poetryFluid={setAutomatic(value){automatic=!!value;},setPaused};
  if(engineReady){document.documentElement.dataset.renderReady='true';report('ready');animation=requestAnimationFrame(tick);}
  else report('error',{message:'当前浏览器无法启动原版流体，请使用开启硬件加速的 Chrome 或 Edge。'});
})();
