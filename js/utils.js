/* ============================================================
   YARDIMCILAR — her modülün kullandığı küçük matematik araçları
   ============================================================ */
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const rnd=(a,b)=>a+Math.random()*(b-a);
