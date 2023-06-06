import ControlPoint from './ControllPoint';
import EndPoint from './EndPoint';
import Path from './Path';
import { useEditorConfig } from '@/store/modules/editor-config';

let listeners;

class Pen {
  inited = false;
  actived = false;
  canvas: HTMLCanvasElement | undefined;
  ctx: CanvasRenderingContext2D | undefined;

  paths: Path<EndPoint>[] = [];
  dragging: boolean = false;
  editCpBalance: boolean = false;
  isNewEndPoint: boolean = false;
  currentEndPoint: EndPoint | null = null;
  draggingControlPoint: ControlPoint | null = null;

  constructor() {
    this.reset();
  }

  init() {
    if (this.inited) return;
    this.canvas = document.querySelector('#area-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    ControlPoint.ctx = this.ctx;
    EndPoint.ctx = this.ctx;
    this.inited = true;
  }

  reset() {
    this.paths = [];
    this.paths.push(new Path());

    this.dragging = false;
    this.editCpBalance = false;
    this.isNewEndPoint = false;
    this.currentEndPoint = null;
    this.draggingControlPoint = null;
  }

  onmousedown(e: MouseEvent) {
    // ctrl 时，结束绘制
    if (e.ctrlKey && this.paths[this.paths.length - 1].length >= 2) {
      this.createPath();
      this.renderer();
      return;
    }
    let loc = this.positionToCanvas(e.clientX, e.clientY);
    let relativeLoc = { x: loc.x, y: loc.y };
    let selectedPath = this.getSelectedPath();
    loc = { x: loc.x, y: loc.y };
    this.dragging = true;
    this.isNewEndPoint = false;
    this.draggingControlPoint = null;
    this.currentEndPoint = this.isExistPoint(relativeLoc.x, relativeLoc.y);
    this.removeSelectedEndPoint();

    if (this.currentEndPoint) {
      // 如果已经存在点
      this.currentEndPoint.selected = true;

      if (this.editCpBalance && !this.draggingControlPoint) {
        let ced = this.currentEndPoint;
        ced.cpBalance = true;
        ced.cp0.x = ced.cp1.x = ced.x;
        ced.cp0.y = ced.cp1.y = ced.y;
        this.isNewEndPoint = true;
      }

      // 如果点击端点，结束路径绘制
      if (
        !this.draggingControlPoint &&
        this.paths.length > 0 &&
        this.currentEndPoint === this.paths[this.paths.length - 1][0] &&
        this.paths[this.paths.length - 1].length > 2
      ) {
        this.createPath();
      }
    } else {
      this.currentEndPoint = this.createEndPoint(relativeLoc.x, relativeLoc.y);
      this.isNewEndPoint = true;
      if (this.editCpBalance && selectedPath) {
        // keydown alt/option
        // add endpoint to selectedendpoint after
        selectedPath.path.addEndPoint(selectedPath.ep, this.currentEndPoint);
      } else {
        this.paths[this.paths.length - 1].push(this.currentEndPoint);
      }
    }
    this.renderer();
  }

  onmousemove(e: MouseEvent) {
    e.preventDefault();
    if (!this.dragging) {
      return;
    }
    let loc = this.positionToCanvas(e.clientX, e.clientY);
    let ced = this.currentEndPoint;
    if (!ced) return;

    loc = { x: loc.x, y: loc.y };

    if (this.isNewEndPoint) {
      ced.cp1.x = loc.x;
      ced.cp1.y = loc.y;

      ced.cp0.x = ced.x * 2 - loc.x;
      ced.cp0.y = ced.y * 2 - loc.y;
    } else if (this.draggingControlPoint) {
      // dragging  controlPoint
      if (this.editCpBalance) {
        ced.cpBalance = false;
      }
      this.draggingControlPoint.x = loc.x;
      this.draggingControlPoint.y = loc.y;
      ced.calculateControlPoint(loc.x, loc.y, this.draggingControlPoint);
    } else {
      // dragging  endpoint
      let offset = { x: loc.x - ced.x, y: loc.y - ced.y };
      ced.x = loc.x;
      ced.y = loc.y;

      ced.cp1.x += offset.x;
      ced.cp1.y += offset.y;
      ced.cp0.x += offset.x;
      ced.cp0.y += offset.y;
    }
    this.renderer();
  }

  onmouseup() {
    this.dragging = false;
    if (this.draggingControlPoint) {
      this.draggingControlPoint = null;
    }
  }
  onkeydown(e: KeyboardEvent) {
    if (e.altKey) {
      e.preventDefault();
      this.editCpBalance = true;
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteEndPoint();
      this.renderer();
    }
  }
  onkeyup(e) {
    switch (e.keyCode) {
      case 18:
        e.preventDefault();
        this.editCpBalance = false;
        break;
      default:
        break;
    }
  }
  deleteEndPoint() {
    let paths = this.paths;
    for (let i = 0, l = paths.length; i < l; i++) {
      paths[i].deleteSelected();
      if (paths[i].length === 0 && i + 1 !== l) {
        paths.splice(i, 1);
        l = paths.length;
        i--;
      }
    }
  }
  createEndPoint(x: number, y: number) {
    let ep = new EndPoint(x, y);
    ep.selected = true;
    return ep;
  }
  createPath() {
    this.paths[this.paths.length - 1].isClose = true;
    this.paths.push(new Path());
  }
  removeSelectedEndPoint() {
    this.paths.forEach(function (path) {
      path.removeSelected();
    });
  }
  getSelectedPath() {
    let i = 0,
      j,
      l1,
      l2;
    for (l1 = this.paths.length; i < l1; i++) {
      for (j = 0, l2 = this.paths[i].length; j < l2; j++) {
        if (this.paths[i][j].selected) {
          return { path: this.paths[i], ep: this.paths[i][j] };
        }
      }
    }
    return null;
  }
  isExistPoint(x: number, y: number) {
    let cep,
      i = 0,
      l;
    for (l = this.paths.length; i < l; i++) {
      cep = this.paths[i].isInPoint(x, y);
      if (cep) {
        if (cep.cp instanceof ControlPoint) {
          this.draggingControlPoint = cep.cp;
        }
        return cep.ep;
      }
    }
    return null;
  }
  positionToCanvas(x, y) {
    if (!this.ctx || !this.canvas) return { x: 0, y: 0 };
    let bbox = this.canvas.getBoundingClientRect();
    return {
      x: x - bbox.left * (this.canvas.width / bbox.width),
      y: y - bbox.top * (this.canvas.height / bbox.height),
    };
  }
  renderer() {
    if (!this.ctx || !this.canvas) return;
    let ep,
      prev_ep,
      ctx = this.ctx;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.paths.forEach(function (path) {
      for (var i = 0, l = path.length; i < l; i++) {
        ep = path[i];
        ep.printAndControlPoints();
        if (i > 0) {
          prev_ep = path[i - 1];
          bezierCurveTo(prev_ep, ep, ctx);
        }
      }
      if (path.isClose) {
        prev_ep = path[l - 1];
        ep = path[0];
        bezierCurveTo(prev_ep, ep, ctx);
      }
    });

    function bezierCurveTo(prev_ep, ep, ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = useEditorConfig().getLineWidth;
      ctx.strokeStyle = useEditorConfig().getColor;
      ctx.moveTo(prev_ep.x, prev_ep.y);
      ctx.bezierCurveTo(prev_ep.cp1.x, prev_ep.cp1.y, ep.cp0.x, ep.cp0.y, ep.x, ep.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  deactive() {
    this.actived = false;
    if (!this.ctx || !this.canvas) return;
    if (listeners) {
      this.canvas.removeEventListener('mousedown', listeners.mousedown, false);
      this.canvas.removeEventListener('mousemove', listeners.mousemove, false);
      this.canvas.removeEventListener('mouseup', listeners.mouseup, false);
      document.removeEventListener('keydown', listeners.keydown, false);
      document.removeEventListener('keyup', listeners.keyup, false);
    }
  }
  active() {
    this.actived = true;
    const _this = this;
    if (!this.ctx || !this.canvas) return;
    listeners = {
      mousedown: function (e) {
        _this.onmousedown(e);
      },
      mousemove: function (e) {
        _this.onmousemove(e);
      },
      mouseup: function () {
        _this.onmouseup();
      },
      keydown: function (e) {
        _this.onkeydown(e);
      },
      keyup: function (e) {
        _this.onkeyup(e);
      },
    };

    this.canvas.addEventListener('mousedown', listeners.mousedown, false);
    this.canvas.addEventListener('mousemove', listeners.mousemove, false);
    this.canvas.addEventListener('mouseup', listeners.mouseup, false);
    document.addEventListener('keydown', listeners.keydown, false);
    document.addEventListener('keyup', listeners.keyup, false);
  }
}

const penInstance = new Pen();

export default penInstance;
