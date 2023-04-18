import Ruler, { RulerProps } from '@scena/ruler';
import { Ref, onMounted, ref } from 'vue';

export default function useRuler(elementRef: Ref<any>, options?: Partial<RulerProps>) {
  const rulerRef = ref<Ruler>();
  onMounted(() => {
    if (elementRef.value) {
      rulerRef.value = new Ruler(elementRef.value, {
        type: 'horizontal',
        ...options,
      });
      rulerRef.value.resize();
      window.addEventListener('resize', () => {
        rulerRef.value?.resize();
      });
    }
  });

  return {
    resize: () => rulerRef.value?.resize(),
    scroll: (pos: number) => rulerRef.value?.scroll(pos),
  };
}
