import { Layer } from '@/views/default-editor/common/types';
import Area from '@/views/default-editor/common/area';

interface Saves {
  size: [number, number];
  layers: Layer[];
}

export function createSaves(size: [number, number], layers: Layer[]) {
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
    size,
    layers: partLayers,
  });
  partLayers.splice(0, partLayers.length - 1);
  return data;
}

export function loadSaves(str: string, curSize: [number, number]) {
  const pureObj = JSON.parse(str) as Saves;
  if (
    Number(curSize[0]) !== Number(pureObj.size[0]) ||
    Number(curSize[1]) !== Number(pureObj.size[1])
  ) {
    throw new Error(
      `该存档尺寸为${pureObj.size[0]}px x ${pureObj.size[1]}px！请确认当前地图尺寸设置是否正确！`,
    );
  }
  const saves: Saves = {
    size: [...pureObj.size],
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
