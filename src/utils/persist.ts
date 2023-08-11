import { useEditorConfig, EditorConfig } from '@/store/modules/editor-config';
import { Layer } from '@/views/default-editor/common/types';
import { Area, Pin, PinIcon } from '@/views/default-editor/draw-element';
import { toRaw } from 'vue';

interface Saves {
  editorConfig: EditorConfig;
  layers: Layer[];
}

function stringifyImageData(data: ImageData) {
  const obj: Recordable<number> = {};
  obj.width = data.width;
  obj.height = data.height;
  data.data.forEach((v, i) => {
    if (v) {
      obj[i] = v;
    }
  });
  return obj;
}

function parseImageData(data: Recordable<number>) {
  const imageData = new ImageData(data.width, data.height);
  Object.keys(data).forEach((key) => {
    if (key !== 'width' && key !== 'height') {
      imageData.data[key] = data[key];
    }
  });
  return imageData;
}

export async function createSaves(layers: Layer[]) {
  const editorConfig = useEditorConfig();
  const partLayers: Partial<Layer>[] = [];
  layers.forEach((layer) => {
    const partLay: Partial<Layer> = {};
    Object.assign(partLay, layer);

    const areas: Partial<Area>[] = [];
    layer.areas.forEach((area) => {
      const newArea = Object.assign({}, toRaw(area));
      // 删除一些用不到且很难序列化的属性
      Reflect.deleteProperty(newArea, 'instance');
      Reflect.deleteProperty(newArea, 'moveable');
      Reflect.deleteProperty(newArea, 'target');
      Reflect.deleteProperty(newArea, 'img');
      // 处理循环引用
      Reflect.deleteProperty(newArea, 'layer');
      newArea.data = stringifyImageData(area.data) as any;
      areas.push(newArea);
    });
    partLay.areas = areas as Area[];

    const pins: Partial<Area>[] = [];
    layer.pins.forEach((pin) => {
      const newPin = Object.assign({}, toRaw(pin));
      newPin.association = Object.assign({}, toRaw(pin.association));
      // 删除一些用不到且很难序列化的属性
      Reflect.deleteProperty(newPin, 'instance');
      Reflect.deleteProperty(newPin, 'moveable');
      Reflect.deleteProperty(newPin, 'target');
      Reflect.deleteProperty(newPin, 'img');
      // 处理循环引用
      Reflect.deleteProperty(newPin, 'layer');
      pins.push(newPin);
    });
    partLay.pins = pins as Pin[];

    partLayers.push(partLay);
  });
  return {
    editorConfig: toRaw(editorConfig.$state),
    layers: partLayers,
  };
}

/**
 * 加载新内容
 * @param str
 * @param useConfig 是否使用配置
 * @param curSize
 * @returns
 */
export function loadNewSaves(str: string, useConfig: boolean, curSize: [number, number]) {
  const pureObj = JSON.parse(str) as Saves;
  if (
    pureObj.editorConfig.projectSizeConfig &&
    (Number(curSize[0]) !== Number(pureObj.editorConfig.projectSizeConfig.offsetWidth) ||
      Number(curSize[1]) !== Number(pureObj.editorConfig.projectSizeConfig.offsetHeight))
  ) {
    throw new Error(
      `该存档尺寸为${pureObj.editorConfig.projectSizeConfig.offsetWidth}px x ${pureObj.editorConfig.projectSizeConfig.offsetHeight}px！请确认当前地图尺寸设置是否正确！`,
    );
  }
  return _loadSaves(pureObj, useConfig);
}

export function loadSaves(str: string, useConfig: boolean) {
  const pureObj = JSON.parse(str) as Saves;
  return _loadSaves(pureObj, useConfig);
}

function _loadSaves(pureObj: Saves, useConfig: boolean) {
  // 设置存档属性，兼容旧数据
  if (useConfig && pureObj.editorConfig) {
    useEditorConfig().setAll(pureObj.editorConfig);
  }
  const saves: Saves = {
    editorConfig: pureObj.editorConfig,
    layers: [],
  };
  if (pureObj.layers.length > 0) {
    for (const layer of pureObj.layers) {
      const newLayer: Layer = Object.create(layer);
      Object.keys(layer).forEach((key) => {
        if (key === 'areas') {
          const areas = layer[key] as Object[];
          if (areas.length > 0) {
            newLayer[key] = [];
            for (let area of areas) {
              // imagedata 的 data 序列化后为普通的（序列化）数组，因此得重新生成 Uint8ClampedArray
              // TODO: 删除 兼容旧数据
              let newData;
              try {
                newData = parseImageData(area['data']);
              } catch (_) {
                const newArray: any[] = [];
                Object.keys(area['data'].data).forEach((key) => {
                  newArray[Number(key)] = area['data'].data[key];
                });
                const newUint8Array = new Uint8ClampedArray(newArray);
                newData = new ImageData(newUint8Array, area['boundRect'][2], area['boundRect'][3]);
              }
              const newArea = new Area(area['name'], newData, area['boundRect']);
              newArea.layer = newLayer;
              newArea.setChoosePoint(area['choosePoint']);
              newLayer[key].push(newArea);
            }
          }
        } else if (key === 'pins') {
          const pins = layer[key] as Object[];
          if (pins.length > 0) {
            newLayer[key] = [];
            for (let pin of pins) {
              const newPin = new Pin('', '', '', '', '', '', { x: 0, y: 0 }, 40, PinIcon.animal);
              Object.assign(newPin, pin);
              newPin.draw = 'none';
              newLayer[key].push(newPin);
            }
          }
        } else {
          newLayer[key] = layer[key];
        }
      });
      saves.layers.push(newLayer);
    }
  }
  return saves;
}
