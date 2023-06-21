import { useEditorConfig, EditorConfig } from '@/store/modules/editor-config';
import { Layer } from '@/views/default-editor/common/types';
import { Area } from '@/views/default-editor/draw-element';

interface Saves {
  editorConfig: EditorConfig;
  layers: Layer[];
}

export function createSaves(layers: Layer[]) {
  const editorConfig = useEditorConfig();
  const partLayers: Partial<Layer>[] = [];
  layers.forEach((layer) => {
    const partLay: Partial<Layer> = {};
    Object.assign(partLay, layer);
    const areas: Partial<Area>[] = [];
    // 删除一些用不到且很难序列化的属性
    layer.areas.forEach((area) => {
      const newArea = Object.assign({}, area);
      Reflect.deleteProperty(newArea, 'instance');
      Reflect.deleteProperty(newArea, 'moveable');
      Reflect.deleteProperty(newArea, 'target');
      areas.push(newArea);
    });
    partLay.areas = areas as Area[];
    partLayers.push(partLay);
  });
  const data = JSON.stringify({
    editorConfig: editorConfig.$state,
    layers: partLayers,
  });
  partLayers.splice(0, partLayers.length - 1);
  return data;
}

export function loadSaves(str: string, useConfig: boolean, curSize: [number, number]) {
  const pureObj = JSON.parse(str) as Saves;
  if (
    pureObj.editorConfig &&
    (Number(curSize[0]) !== Number(pureObj.editorConfig.size.x) ||
      Number(curSize[1]) !== Number(pureObj.editorConfig.size.y))
  ) {
    throw new Error(
      `该存档尺寸为${pureObj.editorConfig.size.x}px x ${pureObj.editorConfig.size.y}px！请确认当前地图尺寸设置是否正确！`,
    );
  }
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
        if (key !== 'areas') {
          newLayer[key] = layer[key];
        } else {
          const areas = layer[key] as Object[];
          if (areas.length > 0) {
            newLayer[key] = [];
            for (let area of areas) {
              // imagedata 的 data 序列化后为普通的（序列化）数组，因此得重新生成 Uint8ClampedArray
              const newArray: any[] = [];
              Object.keys(area['data'].data).forEach((key) => {
                newArray[Number(key)] = area['data'].data[key];
              });
              const newUint8Array = new Uint8ClampedArray(newArray);
              const newData = new ImageData(
                newUint8Array,
                area['boundRect'][2],
                area['boundRect'][3],
              );
              const newArea = new Area(area['name'], newData, area['boundRect']);
              newArea.layer = newLayer;
              newLayer[key].push(newArea);
            }
          }
        }
      });
      saves.layers.push(newLayer);
    }
  }
  return saves;
}
