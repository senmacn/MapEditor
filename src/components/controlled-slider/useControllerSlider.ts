import { onUnmounted, ref, unref } from 'vue';
import { ControlledSliderAction, ControlledSliderProps } from './types';

export default function useControllerSlider(
  props?: ControlledSliderProps,
): [(instance: ControlledSliderAction) => void, ControlledSliderAction] {
  const instanceRef = ref();
  function registerControllerSlider(slider: ControlledSliderAction) {
    if (slider === instanceRef.value) return;
    instanceRef.value = slider;
    props && slider.setProps(props);
    onUnmounted(() => {
      instanceRef.value = undefined;
    });
  }

  function getInstance(): ControlledSliderAction {
    const sliderAction = unref(instanceRef);
    if (!sliderAction) {
      throw new Error('初始化未完成！');
    }
    return sliderAction;
  }

  return [
    registerControllerSlider,
    {
      getValue: () => {
        return getInstance().getValue();
      },
      zoomIn: () => getInstance().zoomIn(),
      zoomOut: () => getInstance().zoomOut(),
      setProps: (props) => getInstance().setProps(props),
      setValue: (value) => getInstance().setValue(value)
    },
  ];
}
