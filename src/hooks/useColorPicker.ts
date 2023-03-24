import Pickr from '@simonwep/pickr';
import { ref } from 'vue';

export function useColorPicker(el: string) {
  const pickrRef = ref();
  const init = () => {
    pickrRef.value = Pickr.create({
      el: el,
      theme: 'nano',
      default: 'red',
      swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(0, 0, 0, 1)',
        'rgba(156, 39, 176, 0.9)',
        'rgba(103, 58, 183, 0.85)',
        'rgba(63, 81, 181, 0.8)',
        'rgba(33, 150, 243, 0.75)',
        'rgba(3, 169, 244, 0.7)',
        'rgba(0, 188, 212, 0.7)',
        'rgba(0, 150, 136, 0.75)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(139, 195, 74, 0.85)',
        'rgba(205, 220, 57, 0.9)',
        'rgba(255, 235, 59, 0.95)',
        'rgba(255, 193, 7, 1)',
      ],
      components: {
        // Main components
        preview: true,
        opacity: true,
        hue: true,
        // Input / output Options
        interaction: {
          hex: true,
          rgba: true,
          hsla: false,
          hsva: false,
          cmyk: false,
          input: true,
          clear: false,
          save: true,
        },
      },
    });
  };
  const on = (event: string, fn: (...props: any) => void): void => {
    pickrRef.value.on(event, fn);
  };
  return {
    init,
    on,
  };
}
