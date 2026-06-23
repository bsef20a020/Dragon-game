/**
 * @param {{event:PointerEvent,canvas:HTMLCanvasElement,onFlap:()=>void}} params
 */
export function handlePointerDownEvent(params) {
  const { event, canvas, onFlap } = params;
  if (event.target.closest('button, select, option, .sheet')) return;
  if (event.target === canvas || event.target.closest('.game-area')) onFlap();
}

/**
 * @param {{event:KeyboardEvent,actions:{flap:()=>void,startOrResume:()=>void,ability:()=>void,togglePause:()=>void,photo:()=>void,toggleGhost:()=>void,cancelRun:()=>void,toggleIntel:()=>void,toggleFullscreen:()=>void}}} params
 */
export function handleKeyEvent(params) {
  const { event, actions } = params;
  const key = event.key.toLowerCase();
  if (event.code === 'Space' || event.code === 'ArrowUp' || key === 'w') { event.preventDefault(); actions.flap(); }
  else if (key === 'enter') { event.preventDefault(); actions.startOrResume(); }
  else if (key === 'f') { event.preventDefault(); actions.ability(); }
  else if (key === 'p' || key === 'escape') { event.preventDefault(); actions.togglePause(); }
  else if (key === 'c') { event.preventDefault(); actions.photo(); }
  else if (key === 'g') { event.preventDefault(); actions.toggleGhost(); }
  else if (key === 'q') { event.preventDefault(); actions.cancelRun(); }
  else if (key === 'h' || key === 'i') { event.preventDefault(); actions.toggleIntel(); }
  else if (key === 'm') { event.preventDefault(); actions.toggleFullscreen(); }
}
