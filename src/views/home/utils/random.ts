const colors = [
  "#C1D82F", "#6EC4FA", "#EFA4B8", "#D18FDA", "#FFCC66", 
  "#62D2A2", "#A7BEE8", "#F39C12", "#5DADE2", "#76D7C4", 
  "#FF7F50", "#F1948A", "#48C9B0", "#AF7AC5", "#E74C3C", 
  "#F7DC6F", "#808000", "#FF6B81", "#BB8FCE", "#EC7063", 
  "#85C1E9", "#8E44AD", "#28C86D", "#F7B217", "#2C3E50", 
  "#E67E22", "#F0E68C", "#3498DB", "#A569BD", "#F0E68C",
  "#4ABDAC", "#FC4A1A", "#FFD700", "#9370DB", "#90EE90", 
  "#73C6B6", "#FFA07A", "#FF4500", "#DB7093", "#40E0D0", 
  "#9FE2BF", "#7B68EE", "#008080", "#DFFF00", "#BA55D3", 
  "#3CB371", "#DC143C", "#FF69B4", "#1E90FF", "#F08080", 
  "#778899", "#20B2AA", "#DDA0DD", "#ADFF2F", "#7FFF00", 
  "#32CD32", "#FA8072", "#87CEFA", "#00FFFF", "#D2691E",
  
];

export function randomHSLColor() {
  const h = Math.round(Math.random() * 60);

  return colors[h];
}
