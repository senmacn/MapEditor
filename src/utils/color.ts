export function hsbToRgba(hue: number, sat: number, bri: number, a = 1): [number, number, number, number] {
  // Ensure hue is in the range of [0, 360], sat and bri are in the range of [0, 1], and a is in the range of [0, 1].
  hue = hue % 360;
  sat = Math.min(1, Math.max(0, sat));
  bri = Math.min(1, Math.max(0, bri));
  a = Math.min(1, Math.max(0, a));

  const i = Math.floor((hue / 60) % 6);
  const f = hue / 60 - i;
  const p = bri * (1 - sat);
  const q = bri * (1 - f * sat);
  const t = bri * (1 - (1 - f) * sat);

  let r = 0,
    g = 0,
    b = 0;

  switch (i) {
    case 0:
      r = bri;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = bri;
      b = p;
      break;
    case 2:
      r = p;
      g = bri;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = bri;
      break;
    case 4:
      r = t;
      g = p;
      b = bri;
      break;
    case 5:
      r = bri;
      g = p;
      b = q;
      break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255)];
}
