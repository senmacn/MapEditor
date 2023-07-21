import { onBeforeUnmount, onMounted } from 'vue';

export default function useLinearGradientRotate(target: string) {
  let angle = 0;
  let targetElement: HTMLElement | null = null;
  let stop;
  function rotateGradient() {
    if (!targetElement) {
      return;
    }
    angle = (angle + 2) % 360; // 使角度保持在 0 到 359 度之间
    
    targetElement.style.backgroundImage = `linear-gradient(${angle}deg, #222222, #333333, #555555, #444444)`;
    stop = setTimeout(() => {
      rotateGradient();
    }, 100);
  }
  onMounted(() => {
    targetElement = document.getElementsByClassName(target)[0] as HTMLElement;
    rotateGradient();
  });
  onBeforeUnmount(() => {
    clearTimeout(stop);
  });
}
