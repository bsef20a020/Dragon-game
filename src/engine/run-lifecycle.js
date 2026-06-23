/**
 * @param {{game:any,ensureAudio:()=>void,audio:any,switchOverlay:(which:any)=>void,resetGame:()=>void,raf:(cb:(t:number)=>void)=>void,loop:(t:number)=>void}} deps
 */
export function startRun(deps) {
  const { game, ensureAudio, audio, switchOverlay, resetGame, raf, loop } = deps;
  window.scrollTo(0, 0);
  ensureAudio();
  if (audio && audio.ac && audio.ac.state === 'suspended') audio.ac.resume().catch(() => {});
  switchOverlay(null);
  resetGame();
  game.started = true;
  game.running = true;
  game.paused = false;
  game.over = false;
  game.lastTime = performance.now();
  raf(loop);
}

/**
 * @param {{game:any,ui:any,switchOverlay:(which:any)=>void}} deps
 */
export function pauseRun(deps) {
  const { game, ui, switchOverlay } = deps;
  if (!game.running || game.paused || game.over) return;
  game.paused = true;
  ui.runStatePill.textContent = 'Paused';
  switchOverlay('pause');
}

/**
 * @param {{game:any,ui:any,switchOverlay:(which:any)=>void,raf:(cb:(t:number)=>void)=>void,loop:(t:number)=>void}} deps
 */
export function resumeRun(deps) {
  const { game, ui, switchOverlay, raf, loop } = deps;
  if (!game.running || !game.paused) return;
  switchOverlay(null);
  game.paused = false;
  ui.runStatePill.textContent = 'Running';
  game.lastTime = performance.now();
  raf(loop);
}

/**
 * @param {{game:any,ui:any,switchOverlay:(which:any)=>void,showToast:(text:string)=>void,initStartState:()=>void}} deps
 */
export function cancelRun(deps) {
  const { game, ui, switchOverlay, showToast, initStartState } = deps;
  if (!game.started) {
    switchOverlay('start');
    return;
  }
  game.running = false;
  game.paused = false;
  game.over = false;
  game.started = false;
  ui.runStatePill.textContent = 'Idle';
  ui.runStatePill.className = 'pill';
  showToast('Run canceled');
  initStartState();
}
