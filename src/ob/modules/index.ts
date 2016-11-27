import * as _ from 'lodash';
import * as ob from '../index';
import * as Actor from './actor';
export { Actor };

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
  return Math.sqrt(ob.ticks * 0.001 + 1);
}

export class Vector {
  static getAngle(v: p5.Vector) {
    return Math.atan2(v.y, v.x);
  }

  static constrain
    (v: p5.Vector, lowX: number, highX: number, lowY: number, highY: number) {
    v.x = ob.p.constrain(v.x, lowX, highX);
    v.y = ob.p.constrain(v.y, lowY, highY);
  }
}

export class DoInterval {
  ticks: number;
  isEnabled = true;

  constructor(public actor: ob.Actor, public func: Function,
    public interval = 60, isStartRandomized = false,
    public isChangedByDifficulty = false) {
    this.ticks = isStartRandomized ? ob.random.getInt(interval) : interval;
  }

  update() {
    this.ticks--;
    if (this.ticks <= 0) {
      if (this.isEnabled) {
        this.func();
      }
      let i = this.interval;
      if (this.isChangedByDifficulty) {
        i /= getDifficulty();
      }
      this.ticks += i;
    }
  }
}

export class RemoveWhenOut {
  constructor(public actor: ob.Actor, public padding = 8) { }

  update() {
    if (!isIn(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding) ||
      !isIn(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding)) {
      this.actor.remove();
    }
  }
}

export class WrapPos {
  constructor(public actor: ob.Actor, public padding = 8) { }

  update() {
    this.actor.pos.x =
      wrap(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding);
    this.actor.pos.y =
      wrap(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding);
  }
}

export class MoveSin {
  prop;
  angle: number;

  constructor
    (public actor: ob.Actor, prop: string,
    public center = 64, public width = 48,
    public speed = 0.1, startAngle = 0) {
    this.prop = getPropValue(actor, prop);
    this.prop.value[this.prop.name] = this.center;
    this.angle = startAngle;
  }

  update() {
    this.angle += this.speed;
    this.prop.value[this.prop.name] = Math.sin(this.angle) * this.width + this.center;
  }
}

function getPropValue(obj, prop: string) {
  let value = obj;
  let name;
  const ps = prop.split('.');
  _.forEach(ps, (p, i) => {
    if (i < ps.length - 1) {
      value = value[p];
    } else {
      name = p;
    }
  });
  return { value, name };
}
