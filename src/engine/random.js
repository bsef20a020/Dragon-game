/**
 * @returns {{set:(seed:number)=>void,next:()=>number}}
 */
export function createSeededRng() {
  let seed = 1;
  return {
    set(s) {
      seed = (s >>> 0) || 1;
    },
    next() {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    }
  };
}

/**
 * @param {string} input
 * @returns {number}
 */
export function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} randomFn
 * @returns {number}
 */
export function randomBetween(min, max, randomFn = Math.random) {
  return randomFn() * (max - min) + min;
}
