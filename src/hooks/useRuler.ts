import Ruler, { RulerProps } from '@scena/ruler';
import { Ref, onBeforeUnmount, onMounted, ref } from 'vue';

export default function useRuler(elementRef: Ref<any>, options?: Partial<RulerProps>) {
  const rulerRef = ref<Ruler>();
  function resize() {
    rulerRef.value?.resize();
  }
  onMounted(() => {
    if (elementRef.value) {
      rulerRef.value = new Ruler(elementRef.value, {
        type: 'horizontal',
        font: '11px sans-serif',
        mainLineSize: 25,
        ...options,
      });
      rulerRef.value.resize();
      window.addEventListener('resize', resize);
    }
  });
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize);
  });
  function rebuild(newOptions) {
    if (rulerRef.value) {
      // @ts-ignore
      elementRef.value.innerHTML = '';
      try {
        rulerRef.value.destroy();
      } catch (e) {}
    }
    if (elementRef.value) {
      rulerRef.value = new Ruler(elementRef.value, {
        type: 'horizontal',
        font: '11px sans-serif',
        mainLineSize: 25,
        ...newOptions,
      });
      rulerRef.value.resize();
    }
  }
  return {
    resize: () => rulerRef.value?.resize(),
    scroll: (pos: number) => rulerRef.value?.scroll(pos),
    rebuild: rebuild,
  };
}
