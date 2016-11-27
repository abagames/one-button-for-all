import * as ob from '../index';

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
    public interval = 60, isStartRandomized = false) {
    this.ticks = isStartRandomized ? ob.random.getInt(interval) : interval;
  }

  update() {
    this.ticks--;
    if (this.ticks <= 0) {
      if (this.isEnabled) {
        this.func();
      }
      this.ticks += this.interval;
    }
  }

  setEnabled(isEnabled = true) {
    this.isEnabled = isEnabled;
  }
}

export class RemoveWhenOut {
  constructor(public actor: ob.Actor, public padding = 0) { }

  update() {
    if (!isIn(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding) ||
      !isIn(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding)) {
      this.actor.remove();
    }
  }
}

export class WrapPos {
  constructor(public actor: ob.Actor, public padding = 0) { }

  update() {
    this.actor.pos.x =
      wrap(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding);
    this.actor.pos.y =
      wrap(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding);
  }
}
