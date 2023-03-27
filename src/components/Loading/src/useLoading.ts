import { unref } from 'vue';
import { createLoading } from './createLoading';
import type { LoadingProps } from './typing';
import type { Ref } from 'vue';

export interface UseLoadingOptions {
  target?: any;
  props?: Partial<LoadingProps>;
}

interface Fn {
  (): void;
}

export function useLoading(props: Partial<LoadingProps>): [Fn, Fn, (s: string) => void];
export function useLoading(opt: Partial<UseLoadingOptions>): [Fn, Fn, (s: string) => void];

export function useLoading(
  opt: Partial<LoadingProps> | Partial<UseLoadingOptions>,
): [Fn, Fn, (s: string) => void] {
  let props: Partial<LoadingProps>;
  let target: HTMLElement | Ref<ElRef> = document.body;

  if (Reflect.has(opt, 'target') || Reflect.has(opt, 'props')) {
    const options = opt as Partial<UseLoadingOptions>;
    props = options.props || {};
    target = options.target || document.body;
  } else {
    props = opt as Partial<LoadingProps>;
  }

  const instance = createLoading(props, undefined, true);

  let startTime = 0;
  const open = (): void => {
    const t = unref(target as Ref<ElRef>);
    if (!t) return;
    instance.open(t);
    startTime = new Date().valueOf();
  };

  // 定时关闭，有最小关闭和时间的话计算
  const close = (): void => {
    const current = new Date().valueOf();
    if (props.minTime && current < startTime + props.minTime) {
      setTimeout(function () {
        close();
      }, startTime + props.minTime - current);
      return;
    }
    instance.close();
  };

  const setTip = (tip: string) => {
    instance.setTip(tip);
  };

  return [open, close, setTip];
}
