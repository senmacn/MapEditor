declare type Point = [number, number];
declare type PointA = { x: number; y: number };
declare type Offset = { x: number; y: number };

declare type Box = [number, number, number, number];

declare interface ProjectSizeConfig {
  Sn: string;
  // 3d地图起始点
  startPointX: number;
  startPointY: number;
  // 3d地图长度
  mapWidth: number;
  // 3d地图宽度
  mapHeight: number;
  // 截屏Actor宽度（一张纹理所对应3d世界边长）
  actorWidth: number;
  // 截屏Actor生成纹理宽度（1024）
  actorPxWidth: number;
  // 项目底图起始点位置
  offsetX: number;
  offsetY: number;
  // 项目长度
  offsetWidth: number;
  // 项目宽度
  offsetHeight: number;
}
