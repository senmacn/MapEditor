import { Tooltip } from 'ant-design-vue';
import { VNode, defineComponent, h } from 'vue';

import { createVNode, render, reactive } from 'vue';

export function createTooltip(target: HTMLElement, props?: Recordable, wait = false) {
  let vm: Nullable<VNode> = null;
  const data = reactive({
    title: '',
    ...props,
    class: 'draw-element-tooltip',
  });

  const TooltipWrap = defineComponent({
    render() {
      return h(Tooltip, {
        ...data,
      });
    },
  });
  vm = createVNode(TooltipWrap);

  if (wait) {
    setTimeout(() => {
      render(vm, target);
    }, 0);
  } else {
    render(vm, target);
  }

  return {
    vm,
    setTitle: (title: string) => {
      data.title = title;
    },
    get $el() {
      return vm?.el as HTMLElement;
    },
  };
}
