// The upstream engine calls ga(). Deliberately provide no analytics transport.
window.ga = function () {};
window.addEventListener('error', event => {
  if (parent !== window) parent.postMessage({channel:'poetry-fluid/v1',type:'error',message:event.message || '流体资源未能加载'}, location.origin);
});
window.addEventListener('keydown', event => {
  // The parent owns study/navigation shortcuts; the original P/space handlers
  // must not unexpectedly pause or burst while focus remains on the canvas.
  if (['Escape',' ','p','P'].includes(event.key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === 'Escape' && parent !== window) parent.postMessage({channel:'poetry-fluid/v1',type:'escape'},location.origin);
  }
},true);
