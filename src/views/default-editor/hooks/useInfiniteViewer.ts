import type { Ref } from 'vue';
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useEditorConfig } from '@/store/modules/editor-config';
import throttle from 'lodash-es/throttle';

function useInfiniteViewer(viewer: string, viewport: string): [Ref<[number, number]>] {
  let $viewer: HTMLElement;
  let $viewport: HTMLElement;
  let $bg1: HTMLElement;
  let $bg2: HTMLElement;

  const dragState = {
    isDrag: false,
  };
  const viewportOffset: Ref<[number, number]> = ref([0, 0]);

  const configRef = useEditorConfig();
  const updateViewPort = () => {
    requestAnimationFrame(() => {
      $viewport!.style.transform =
        'translate(' +
        viewportOffset.value[0] +
        'px, ' +
        viewportOffset.value[1] +
        'px) scale(' +
        configRef.zoom +
        ')';
      $bg1.style.backgroundPosition = `${viewportOffset.value[0]}px ${viewportOffset.value[1]}px`;
      $bg2.style.backgroundPosition = `${viewportOffset.value[0]}px ${viewportOffset.value[1]}px`;
    });
  };
  // zoom配置修改时，更新
  watch(
    () => configRef.zoom,
    () => {
      updateViewPort();
    },
  );

  const handleWheelEvent = throttle((event: WheelEvent) => {
    event.preventDefault();
    const prevScale = configRef.zoom;
    if (event.deltaY < 0 && configRef.zoom < 5) {
      configRef.zoom = Math.min(5, configRef.zoom + 0.1);
    } else if (event.deltaY > 0 && configRef.zoom > 0.1) {
      configRef.zoom = Math.max(0.1, configRef.zoom - 0.1);
    } else {
      return;
    }
    // 计算新的缩放对象位置和大小
    const contentRect = $viewport!.getBoundingClientRect();
    const xRelativeToContent = event.clientX - contentRect.left;
    const yRelativeToContent = event.clientY - contentRect.top;
    const scaleChange = (-configRef.zoom + prevScale) / prevScale;
    const offsetX = xRelativeToContent * scaleChange;
    const offsetY = yRelativeToContent * scaleChange;
    viewportOffset.value[0] += offsetX;
    viewportOffset.value[1] += offsetY;
  }, 16);

  const handleMouseDown = (msEvent: MouseEvent) => {
    if (msEvent.button === 1) {
      msEvent.preventDefault();
      dragState.isDrag = true;
      $viewer.style.cursor = 'move';
    }
  };
  const handleMouseMove = throttle((msEvent: MouseEvent) => {
    if (!dragState.isDrag) return;
    msEvent.preventDefault();

    viewportOffset.value[0] += msEvent.movementX * 2;
    viewportOffset.value[1] += msEvent.movementY * 2;

    updateViewPort();
  }, 16);
  const handleMouseUp = (_msEvent: MouseEvent) => {
    dragState.isDrag = false;
    $viewer.style.cursor = 'auto';
  };
  const handleMouseMoveLeave = (_msEvent: MouseEvent) => {
    dragState.isDrag = false;
    $viewer.style.cursor = 'auto';
  };

  onMounted(() => {
    $viewer = document.querySelector(viewer) as HTMLElement;
    $viewport = document.querySelector(viewport) as HTMLElement;
    if (!$viewer || !$viewport) {
      return;
    }

    $viewer.addEventListener('wheel', handleWheelEvent);
    $viewer.addEventListener('mousedown', handleMouseDown);
    $viewer.addEventListener('mousemove', handleMouseMove);
    $viewer.addEventListener('mouseup', handleMouseUp);
    $viewer.addEventListener('mouseleave', handleMouseMoveLeave);

    $bg1 = document.createElement('div');
    $bg1.className = 'scroll-area-bg1';
    $viewer.insertBefore($bg1, $viewer.firstChild);
    $bg2 = document.createElement('div');
    $bg2.className = 'scroll-area-bg2';
    $viewer.insertBefore($bg2, $viewer.firstChild);
  });
  onBeforeUnmount(() => {
    $viewer?.removeEventListener('wheel', handleWheelEvent);
    $viewer?.removeEventListener('mousedown', handleMouseDown);
    $viewer?.removeEventListener('mousemove', handleMouseMove);
    $viewer?.removeEventListener('mouseup', handleMouseUp);
    $viewer?.removeEventListener('mouseleave', handleMouseMoveLeave);

    handleMouseMove.cancel();
    handleWheelEvent.cancel();
  });

  return [viewportOffset];
}

export default useInfiniteViewer;
