import type { DriveStep } from 'driver.js';
import { driver } from 'driver.js';
import { onMounted, onBeforeUnmount } from 'vue';

export default function useDriver(id: string, steps: DriveStep[]) {
  const _driver = driver({
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: '太棒了，我逐渐理解一切',
  });
  const localId = 'driver-done-' + id;
  function handleDoneDriver() {
    localStorage.setItem(localId, 'done');
    _driver.destroy();
  }

  steps.push({
    element: steps[steps.length - 1].element,
    popover: {
      title: '完成引导',
      align: 'start',
      onNextClick: handleDoneDriver,
      onCloseClick: handleDoneDriver,
    },
  });
  _driver.setSteps(steps);
  onMounted(() => {
    const ifDone = localStorage.getItem(localId);
    if (!ifDone) {
      _driver.drive();
    }
  });
  onBeforeUnmount(() => {
    _driver && _driver.destroy();
  });
}
