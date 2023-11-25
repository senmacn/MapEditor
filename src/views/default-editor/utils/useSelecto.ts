import type { Ref } from 'vue';
import { onBeforeUnmount, onMounted, unref, watch } from 'vue';
import Selecto from 'selecto';
import { useCanvasState } from '@/store/modules/canvas-state';
import Moveable from 'moveable';
import controller, { AreaActionType } from '../common/canvas-state-controller';

function getNumberFromCss(css: string) {
  return Number(css.replace('px', ''));
}

export default function useSelecto(target: Ref<HTMLElement> | HTMLElement = document.body) {
  let selecto: Selecto;
  let moveable: Moveable;
  const canvasState = useCanvasState();
  let currentAreas: string = '';
  onMounted(() => {
    selecto = new Selecto({
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
    // 历史记录
    const history = new Map<string, [number, number]>();
    // 框选后统一可拖动
    moveable = new Moveable(document.getElementById('scroller') as HTMLElement, {
      draggable: true,
    })
      .on('clickGroup', (e) => {
        selecto.clickTarget(e.inputEvent, e.inputTarget);
      })
      .on('dragStart', (e) => {
        history.set(e.target.id, [getNumberFromCss(e.target.style.left), getNumberFromCss(e.target.style.top)]);
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
          boundRect[0] = getNumberFromCss(e.target.style.left);
          boundRect[1] = getNumberFromCss(e.target.style.top);
          setTimeout(() => {
            area.moveable?.updateRect();
          }, 50);
        }
        // 记录历史
        controller.pushAction({
          key: new Date().getTime().toString(),
          uuid: e.target.id,
          type: AreaActionType.MOVE,
          state: history.get(e.target.id) as [number, number],
        });
        history.clear();
      })
      .on('dragGroupStart', (e) => {
        e.events.forEach((ev) => {
          history.set(ev.target.id, [getNumberFromCss(ev.target.style.left), getNumberFromCss(ev.target.style.top)]);
        });
      })
      // 多个框选拖动
      .on('dragGroup', (e) => {
        e.events.forEach((ev) => {
          ev.target.style.left = `${ev.left}px`;
          ev.target.style.top = `${ev.top}px`;
        });
      })
      .on('dragGroupEnd', (e) => {
        const key = new Date().getTime().toString();
        e.events.forEach((ev) => {
          const uuid = ev.target.id;
          const area = canvasState.getAreaMap.get(uuid);
          if (area) {
            // 拖拽时只修改了dom，需要更新Area信息
            const boundRect = area.getBoundRect();
            boundRect[0] = Number(ev.target.style.left.replace('px', ''));
            boundRect[1] = Number(ev.target.style.top.replace('px', ''));
            setTimeout(() => {
              area.moveable?.updateRect();
            }, 50);
          }
          // 记录历史
          controller.pushAction({
            key: key,
            uuid: uuid,
            type: AreaActionType.MOVE,
            state: history.get(uuid) as [number, number],
          });
        });
        history.clear();
      });

    selecto
      .on('dragStart', (e) => {
        const target = e.inputEvent.target;
        if (moveable.isMoveableElement(target) || targets.some((t) => t === target || t.contains(target))) {
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
        const areas: any[] = [];
        for (const layer of useCanvasState().getLayers) {
          for (const area of layer.areas) {
            if (addIds.includes(area.getUuid())) {
              areas.push(area);
              continue;
            }
          }
        }
        currentAreas = areas.map((area) => area.getUuid()).join('');
        if (areas.length === 1) {
          // 选中一个不在这处理
          controller.setCurrentAreas(areas);
          return;
        } else {
          controller.setCurrentAreas(areas, true);
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
  onBeforeUnmount(() => {
    moveable.destroy();
    selecto.destroy();
  });

  // 新增、编辑时得取消选中
  watch(
    () => controller.isDrawing(),
    () => {
      if (controller.isDrawing()) {
        selecto && selecto.setSelectedTargets([]);
        if (moveable) {
          moveable.target = null;
        }
      }
    },
  );

  watch(
    () => controller.getCurrentAreas(),
    () => {
      if (
        controller
          .getCurrentAreas()
          .map((area) => area.getUuid())
          .join('') !== currentAreas
      ) {
        selecto && selecto.setSelectedTargets([]);
        if (moveable) {
          moveable.target = null;
        }
      }
    },
  );

  function updateRect() {
    if (selecto && moveable) {
      moveable.updateRect();
    }
  }
  return {
    updateRect,
  };
}
