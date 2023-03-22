import { createContext, useContext } from '../../../hooks/useContext';

const key = Symbol('canvas-config');

export type CanvasConfig = {
  [K: string]: Recordable<string> | number | boolean;
  style: Recordable<string>;
  density: number;
  zoom: number;
  autoConnect: boolean;
};

export function createCanvasConfigContext(instance: CanvasConfig) {
  return createContext(instance, key);
}

export function useCanvasConfigContext(): CanvasConfig {
  return useContext(key) as CanvasConfig;
}
