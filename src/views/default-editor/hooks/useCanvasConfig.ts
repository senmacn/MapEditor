import { createContext, useContext } from '../../../hooks/useContext';
import { CanvasConfig } from '../common/types';

const key = Symbol('canvas-config');

export function createCanvasConfigContext(instance: CanvasConfig) {
  return createContext(instance, key);
}

export function useCanvasConfigContext(): CanvasConfig {
  return useContext(key) as CanvasConfig;
}
