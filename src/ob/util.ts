import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as ob from './index';

export function isIn(v: number, low: number, high: number) {
  return v >= low && v <= high;
}

export function wrap(v: number, low: number, high: number) {
  const w = high - low;
  const o = v - low;
  if (o >= 0) {
    return o % w + low;
  } else {
    return w + o % w + low;
  }
}

export function getDifficulty() {
  return ob.scene === ob.Scene.title ? 1 : ob.ticks * 0.001 + 1;
}

export function fillStar(c = 64,
  minSpeedY = 0.5, maxSpeedY = 1.5, minSpeedX = 0, maxSpeedX = 0) {
  _.times(c, () => new ob.Star(minSpeedY, maxSpeedY, minSpeedX, maxSpeedX));
}

export function fillPanel() {
  _.times(10, x => {
    _.times(10, y => {
      new ob.Panel(x * 16 - 8, y * 16 - 8);
    });
  });
}

export function getClassName(obj) {
  return ('' + obj.constructor).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
}

export class Vector {
  static getAngle(v: p5.Vector, to: p5.Vector = null) {
    return to == null ? Math.atan2(v.y, v.x) : Math.atan2(to.y - v.y, to.x - v.x);
  }

  static addAngle(v: p5.Vector, angle: number, value: number) {
    v.x += Math.cos(angle) * value;
    v.y += Math.sin(angle) * value;
  }

  static constrain
    (v: p5.Vector, lowX: number, highX: number, lowY: number, highY: number) {
    v.x = ob.p.constrain(v.x, lowX, highX);
    v.y = ob.p.constrain(v.y, lowY, highY);
  }

  static swapXy(v: p5.Vector) {
    const t = v.x;
    v.x = v.y;
    v.y = t;
  }
}
