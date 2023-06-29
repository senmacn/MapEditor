export function randomHSLColor() {
  const h = Math.floor(Math.random() * 331 + 30);
  const s = Math.floor(Math.random() * 71 + 30);
  const l = Math.floor(Math.random() * 71 + 30);

  return `hsl(${h}, ${s}%, ${l}%)`;
}
