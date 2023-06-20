import { Ref, onMounted, unref } from 'vue';
import Selecto from 'selecto';
import { useCanvasState } from '@/store/modules/canvas-state';
import Moveable from 'moveable';
import controller from '../common/canvas-state-controller';

export default function useSelecto(target: Ref<HTMLElement> | HTMLElement = document.body) {
  const canvasState = useCanvasState();

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

    let targets: any[] = [];
    // 框选后统一可拖动
    const moveable = new Moveable(document.getElementById('scroller') as HTMLElement, {
      draggable: true,
    })
      .on('clickGroup', (e) => {
        selecto.clickTarget(e.inputEvent, e.inputTarget);
      })
      // 单个框选拖动
      .on('drag', (e) => {
        e.target.style.left = `${e.left}px`;
        e.target.style.top = `${e.top}px`;
      })
      .on('dragEnd', (e) => {
        const uuid = e.target.id;
        const area = canvasState.getAreaMap.get(uuid);
        // 拖拽时只修改了dom，需要更新Area信息
        if (area) {
          const boundRect = area.getBoundRect();
          boundRect[0] = Number(e.target.style.left.replace('px', ''));
          boundRect[1] = Number(e.target.style.top.replace('px', ''));
          setTimeout(() => {
            area.moveable?.updateRect();
          }, 50);
        }
      })
      // 多个框选拖动
      .on('dragGroup', (e) => {
        e.events.forEach((ev) => {
          ev.target.style.left = `${ev.left}px`;
          ev.target.style.top = `${ev.top}px`;
        });
      })
      .on('dragGroupEnd', (e) => {
        // 拖拽时只修改了dom，需要更新Area信息
        e.events.forEach((ev) => {
          const uuid = ev.target.id;
          const area = canvasState.getAreaMap.get(uuid);
          if (area) {
            const boundRect = area.getBoundRect();
            boundRect[0] = Number(ev.target.style.left.replace('px', ''));
            boundRect[1] = Number(ev.target.style.top.replace('px', ''));
            setTimeout(() => {
              area.moveable?.updateRect();
            }, 50);
          }
        });
      });

    selecto
      .on('dragStart', (e) => {
        const target = e.inputEvent.target;
        if (
          moveable.isMoveableElement(target) ||
          targets.some((t) => t === target || t.contains(target))
        ) {
          e.stop();
        }
      })
      .on('selectEnd', (e) => {
        e.afterAdded.forEach((el) => {
          el.classList.add('selected');
        });
        e.afterRemoved.forEach((el) => {
          el.classList.remove('selected');
        });
        // 计算选中和未选中
        const addIds = e.afterAdded.map((el) => el.id);
        const removeIds = e.afterRemoved.map((el) => el.id);
        for (const layer of useCanvasState().getLayers) {
          for (const area of layer.areas) {
            if (addIds.includes(area.getUuid())) {
              controller.addCurrentArea(area);
              continue;
            }
            if (removeIds.includes(area.getUuid())) {
              controller.removeCurrentArea(area);
            }
          }
        }

        // 更新moveable组
        targets = e.selected;
        moveable.target = targets;
        if (e.isDragStart) {
          e.inputEvent.preventDefault();
          setTimeout(() => {
            moveable.dragStart(e.inputEvent);
          });
        }

        // 清理moveable-control-box
        // TODO:多选框选时会创建多余的box无法自动清理 
        const boxes = document.getElementsByClassName('moveable-control-box');
        for (let index = 0; index < boxes.length; index++) {
          const element = boxes[index];
          if (element.children.length === 0) {
            element.parentNode?.removeChild(element);
          }
        }
      });
  });
}
