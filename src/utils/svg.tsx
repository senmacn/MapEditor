import { h, render } from 'vue';
import SvgIcon from '@/components/svg-icon.vue';

interface SVGRenderProperties {
  color?: string;
  size?: number;
}

export function renderSvg(
  ele: Element,
  name: string,
  options: SVGRenderProperties = { color: '#333', size: 40 },
) {
  render(h(<SvgIcon name={name} color={options.color} size={options.size}></SvgIcon>), ele);
}
