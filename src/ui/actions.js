/**
 * @param {{score:number,modeName:string,elementName:string}} params
 * @returns {string}
 */
export function buildShareText(params) {
  return `Dragon Flight Mythic Run: ${Math.floor(params.score)} score in ${params.modeName} as ${params.elementName} dragon.`;
}

/**
 * @param {{text:string,onCopied:()=>void,onFallback:()=>void}} params
 */
export async function shareOrCopyText(params) {
  const { text, onCopied, onFallback } = params;
  if (navigator.share) {
    try { await navigator.share({ title: 'Dragon Flight Mythic Run', text }); } catch {}
  }
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    onCopied();
  } catch {
    onFallback();
  }
}

/**
 * @param {{canvas:HTMLCanvasElement,prefix?:string,onSaved:()=>void,onFailed:()=>void}} params
 */
export function takeCanvasPhoto(params) {
  const { canvas, prefix = 'dragon-flight', onSaved, onFailed } = params;
  try {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${Date.now()}.png`;
    a.click();
    onSaved();
  } catch {
    onFailed();
  }
}

export async function toggleFullscreenMode() {
  if (!document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen?.(); } catch {}
  } else {
    try { await document.exitFullscreen?.(); } catch {}
  }
}
