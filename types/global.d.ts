import type {
  VNodeChild,
  ComponentPublicInstance,
  FunctionalComponent,
  PropType as VuePropType,
} from 'vue';

declare global {
  declare type PropType<T> = VuePropType<T>;
  declare type VueNode = VNodeChild | JSX.Element;

  declare type Fn = () => void;

  declare type Writable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  declare type Indexable<T> = {
    [key: string]: T;
  };

  declare type Mutable<T> = { -readonly [P in keyof T]: T[P] };

  declare type Nullable<T> = T | null;
  declare type NonNullable<T> = T extends null | undefined ? never : T;
  declare type Recordable<T = any> = Record<string, T>;
  declare type ReadonlyRecordable<T = any> = {
    readonly [key: string]: T;
  };
  declare type Indexable<T = any> = {
    [key: string]: T;
  };

  declare type IntervalHandle = ReturnType<typeof setInterval>;

  declare type LocalError = {
    showMessage?: string;
  } & Error;
  declare type LocalResult<T> = LocalError | T;

  import '@ant-design/icons-vue';
  import 'ant-design-vue/typings/global';

  declare interface ViteEnv {
    VITE_PORT: number;
  }

  declare interface Window {
    electronAPI: LocalApi;
  }
}

declare module 'vue' {
  export type JSXComponent<Props = any> =
    | { new (): ComponentPublicInstance<Props> }
    | FunctionalComponent<Props>;
}
