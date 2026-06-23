/**
 * @param {{overlay:HTMLElement,sheets:{start:HTMLElement,pause:HTMLElement,gameover:HTMLElement,how:HTMLElement},which:'start'|'pause'|'gameover'|'how'|null}} params
 */
export function switchOverlayPanels(params) {
  const { overlay, sheets, which } = params;
  overlay.classList.remove('hidden');
  sheets.start.style.display = 'none';
  sheets.pause.style.display = 'none';
  sheets.gameover.style.display = 'none';
  sheets.how.style.display = 'none';
  if (which === 'start') sheets.start.style.display = 'block';
  else if (which === 'pause') sheets.pause.style.display = 'block';
  else if (which === 'gameover') sheets.gameover.style.display = 'block';
  else if (which === 'how') sheets.how.style.display = 'block';
  else overlay.classList.add('hidden');
}

/**
 * @param {{sidebar:HTMLElement,ui:any,next:boolean}} params
 * @returns {boolean}
 */
export function setSidebarCollapsedState(params) {
  const { sidebar, ui, next } = params;
  const collapsed = !!next;
  sidebar.classList.toggle('open', !collapsed);
  if (ui.sidebarBtn) ui.sidebarBtn.textContent = collapsed ? 'Open Intel' : 'Close Intel';
  if (ui.focusBtn) ui.focusBtn.textContent = collapsed ? 'Open Intel' : 'Close Intel';
  if (ui.intelBtn) ui.intelBtn.textContent = collapsed ? 'Run Intel' : 'Close Intel';
  return collapsed;
}
