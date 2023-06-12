import ControlPoint from './ControllPoint';
import EndPoint from './EndPoint';

export default class Path<T extends EndPoint> extends Array<T> {
  isClose: boolean = false;
  isInPoint(x: number, y: number) {
    var cep;
    for (var i = 0, l = this.length; i < l; i++) {
      cep = this[i].isInPoint(x, y);
      if (cep) {
        return { ep: this[i], cp: cep instanceof ControlPoint ? cep : null };
      }
    }
    return null;
  }
  removeSelected() {
    this.forEach(function (ep) {
      ep.selected = false;
    });
  }
  deleteSelected() {
    this.splice(this.length - 1, 1);
  }
  addEndPoint(oed, ed) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === oed) {
        this.splice(i + 1, 0, ed);
      }
    }
  }
}
