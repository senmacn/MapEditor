import { unref, type Ref } from 'vue';
import { createTooltip } from './createTooltip';

export interface UseTooltipOptions {
  target: HTMLElement | Ref<ElRef>;
  props?: Partial<Recordable>;
}

export function useTooltip(opt: UseTooltipOptions): [(s: string) => void];

export function useTooltip(opt: UseTooltipOptions): [(s: string) => void] {
  const props = opt.props || {};
  const target = opt.target;

  const instance = createTooltip(unref(target) || document.createElement('div'), props, true);

  const setTitle = (tip: string) => {
    instance.setTitle(tip);
  };

  return [setTitle];
}
