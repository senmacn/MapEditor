import d3, { Quadtree } from 'd3-quadtree';

export function createD3Tree(data?: any): Quadtree<Point> {
  const tree = d3.quadtree().addAll(data);
  return tree;
}
