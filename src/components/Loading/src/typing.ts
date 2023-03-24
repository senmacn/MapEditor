export enum SizeEnum {
  SMALL = 24,
  DEFAULT = 28,
  LARGE = 32
}

export interface LoadingProps {
  tip: string;
  size: SizeEnum;
  absolute: boolean;
  loading: boolean;
  background: string;
}
