import * as _ from 'lodash';
import * as ob from '../index';

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
        i /= ob.getDifficulty();
      }
      this.ticks += i;
    }
  }
}

export class RemoveWhenOut {
  constructor(public actor: ob.Actor, public padding = 8) { }

  update() {
    if (!ob.isIn(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding) ||
      !ob.isIn(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding)) {
      this.actor.remove();
    }
  }
}

export class WrapPos {
  constructor(public actor: ob.Actor, public padding = 8) { }

  update() {
    this.actor.pos.x =
      ob.wrap(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding);
    this.actor.pos.y =
      ob.wrap(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding);
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
