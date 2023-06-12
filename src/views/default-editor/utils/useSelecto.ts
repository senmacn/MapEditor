import { Ref, onMounted, unref } from 'vue';
import Selecto from 'selecto';
import { useCanvasState } from '@/store/modules/canvas-state';

export default function useSelecto(target: Ref<HTMLElement> | HTMLElement = document.body) {
  onMounted(() => {
    const selecto = new Selecto({
      // The container to add a selection element
      container: unref(target),
      // Selecto's root container (No transformed container. (default: null)
      rootContainer: null,
      // The area to drag selection element (default: container)
      dragContainer: '.layer-instance',
      // Targets to select. You can register a queryselector or an Element.
      selectableTargets: ['.layer-instance .moveable'],
      // Whether to select by click (default: true)
      selectByClick: false,
      // Whether to select from the target inside (default: true)
      selectFromInside: false,
      // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
      continueSelect: false,
      // Determines which key to continue selecting the next target via keydown and keyup.
      toggleContinueSelect: 'shift',
      // The container for keydown and keyup events
      keyContainer: window,
      // The rate at which the target overlaps the drag area to be selected. (default: 100)
      hitRate: 100,
    });

    selecto.on('selectEnd', (e) => {
      e.afterAdded.forEach((el) => {
        el.classList.add('selected');
      });
      e.afterRemoved.forEach((el) => {
        el.classList.remove('selected');
      });
      const addIds = e.afterAdded.map((el) => el.id);
      const removeIds = e.afterRemoved.map((el) => el.id);
      for (const layer of useCanvasState().layers) {
        for (const area of layer.areas) {
          if (addIds.includes(area.getUuid())) {
            area.select();
            continue;
          }
          if (removeIds.includes(area.getUuid())) {
            area.cancelSelect();
          }
        }
      }
    });
  });
}
