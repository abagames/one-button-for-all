import * as _ from 'lodash';
import * as ob from '../index';
import * as sss from 'sss';
import * as ppe from 'ppe';

class Module {
  constructor(public actor: ob.Actor) {
    if (actor == null) {
      ob._addModule(this);
    } else {
      actor._addModule(this);
    }
  }
}

export class DoInterval extends Module {
  ticks: number;
  isEnabled = true;

  constructor(actor: ob.Actor, public func: Function,
    public interval = 60, isStartRandomized = false,
    public isChangedByDifficulty = false) {
    super(actor);
    this.ticks = isStartRandomized ? ob.random.getInt(interval) : interval;
  }

  update() {
    this.ticks--;
    if (this.ticks <= 0) {
      if (this.isEnabled) {
        this.func(this);
      }
      let i = this.interval;
      if (this.isChangedByDifficulty) {
        i /= ob.getDifficulty();
      }
      this.ticks += i;
    }
  }
}

export class DoCond extends Module {
  isEnabled = true;

  constructor(actor: ob.Actor, public func: Function, public cond: Function) {
    super(actor);
  }

  update() {
    if (this.isEnabled && this.cond(this)) {
      this.func(this);
    }
  }
}

export class RemoveWhenOut extends Module {
  constructor(actor: ob.Actor, padding = 8,
    public paddingRight: number = null, public paddingBottom: number = null,
    public paddingLeft: number = null, public paddingTop: number = null) {
    super(actor);
    if (this.paddingRight == null) {
      this.paddingRight = padding;
    }
    if (this.paddingBottom == null) {
      this.paddingBottom = padding;
    }
    if (this.paddingLeft == null) {
      this.paddingLeft = padding;
    }
    if (this.paddingTop == null) {
      this.paddingTop = padding;
    }
  }

  update() {
    if (!ob.isIn(this.actor.pos.x, -this.paddingLeft,
      ob.screen.size.x + this.paddingRight) ||
      !ob.isIn(this.actor.pos.y, -this.paddingTop,
        ob.screen.size.y + this.paddingBottom)) {
      this.actor.remove();
    }
  }
}

export class RemoveWhenInAndOut extends RemoveWhenOut {
  isIn = false;
  paddingOuter = 64;

  constructor(actor: ob.Actor, padding = 8,
    paddingRight: number = null, paddingBottom: number = null,
    paddingLeft: number = null, paddingTop: number = null) {
    super(actor, padding, paddingRight, paddingBottom, paddingLeft, paddingTop);
  }

  update() {
    if (this.isIn) {
      return super.update();
    }
    if (ob.isIn(this.actor.pos.x, -this.paddingLeft,
      ob.screen.size.x + this.paddingRight) &&
      ob.isIn(this.actor.pos.y, -this.paddingTop,
        ob.screen.size.y + this.paddingBottom)) {
      this.isIn = true;
    }
    if (!ob.isIn(this.actor.pos.x, -this.paddingOuter,
      ob.screen.size.x + this.paddingOuter) ||
      !ob.isIn(this.actor.pos.y, -this.paddingOuter,
        ob.screen.size.y + this.paddingOuter)) {
      this.actor.remove();
    }
  }
}

export class WrapPos extends Module {
  constructor(actor: ob.Actor, public padding = 8) {
    super(actor);
  }

  update() {
    this.actor.pos.x =
      ob.wrap(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding);
    this.actor.pos.y =
      ob.wrap(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding);
  }
}

export class MoveSin extends Module {
  prop;
  angle: number;

  constructor
    (actor: ob.Actor, prop: string,
    public center = 64, public amplitude = 48,
    public speed = 0.1, startAngle = 0) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.prop.value[this.prop.name] = this.center;
    this.angle = startAngle;
  }

  update() {
    this.angle += this.speed;
    this.prop.value[this.prop.name] = Math.sin(this.angle) * this.amplitude + this.center;
  }
}

export class MoveRoundTrip extends Module {
  prop;
  vel: number;

  constructor
    (actor: ob.Actor, prop: string,
    public center = 64, public width = 48,
    public speed = 1, startVel = 1) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.prop.value[this.prop.name] = this.center;
    this.vel = startVel;
  }

  update() {
    this.prop.value[this.prop.name] += this.vel * this.speed;
    if ((this.vel > 0 && this.prop.value[this.prop.name] > this.center + this.width) ||
      (this.vel < 0 && this.prop.value[this.prop.name] < this.center - this.width)) {
      this.vel *= -1;
      this.prop.value[this.prop.name] += this.vel * this.speed * 2;
    }
  }
}

export class MoveTo extends Module {
  targetPos = ob.p.createVector();

  constructor
    (actor: ob.Actor, public ratio = 0.1) {
    super(actor);
  }

  update() {
    this.actor.pos.x += (this.targetPos.x - this.actor.pos.x) * this.ratio;
    this.actor.pos.y += (this.targetPos.y - this.actor.pos.y) * this.ratio;
  }
}

export class AbsorbPos extends Module {
  absorbingTicks = 0;

  constructor(actor: ob.Actor, public type: string = 'player', public dist = 32) {
    super(actor);
  }

  update() {
    const absorbingTos = ob.Actor.get(this.type);
    if (absorbingTos.length > 0) {
      const to = absorbingTos[0];
      if (this.absorbingTicks > 0) {
        const r = this.absorbingTicks * 0.01;
        this.actor.pos.x += (to.pos.x - this.actor.pos.x) * r;
        this.actor.pos.y += (to.pos.y - this.actor.pos.y) * r;
        this.absorbingTicks++;
      } else if (this.actor.pos.dist(to.pos) < this.dist) {
        this.absorbingTicks = 1;
      }
    }
  }
}

export class HaveGravity extends Module {
  velocity = 0.01;

  constructor(actor: ob.Actor, public mass = 0.1) {
    super(actor);
  }

  update() {
    _.forEach(ob.Actor.getByModuleName('HaveGravity'), a => {
      if (a === this.actor) {
        return;
      }
      const r = ob.wrap(a.pos.dist(this.actor.pos), 1, 999) * 0.1;
      const v = (a.getModule('HaveGravity').mass * this.mass) / r / r /
        this.mass * this.velocity;
      const an = ob.Vector.getAngle(this.actor.pos, a.pos);
      ob.Vector.addAngle(this.actor.vel, an, v);
    });
  }
}

export class LimitInstances {
  constructor(actor: ob.Actor, count = 1) {
    if (ob.Actor.get(actor.type).length > count) {
      actor.remove();
    }
  }
}

export class JumpOnWall extends Module {
  isOnWall = false;
  wasOnWall = false;

  constructor(actor: ob.Actor,
    public jumpVel = 5, public fallFastVel = 10, public fallSlowVel = 1,
    public fallRatio = 0.04) {
    super(actor);
  }

  update() {
    const wasOnWall = this.wasOnWall;
    this.wasOnWall = this.isOnWall;
    this.isOnWall = false;
    let collisionInfo: any = { dist: 999 };
    _.forEach(this.actor.testCollision('wall'), (w: ob.Wall) => {
      const ci = w.getCollisionInfo(this.actor);
      if (ci.dist < collisionInfo.dist) {
        collisionInfo = ci;
      }
      this.isOnWall = true;
    });
    if (this.isOnWall) {
      collisionInfo.wall.adjustPos(this.actor, collisionInfo.angle);
      if (!wasOnWall) {
        sss.play(`s_${this.actor.type}_jow`);
      }
      if (ob.ui.isJustPressed) {
        this.actor.vel.y = -this.jumpVel;
        ppe.emit(`m_${this.actor.type}_jow`,
          this.actor.pos.x, this.actor.pos.y, 0);
        ppe.emit(`m_${this.actor.type}_jow`,
          this.actor.pos.x, this.actor.pos.y, Math.PI);
        sss.play(`j_${this.actor.type}_jow`);
      } else {
        this.actor.vel.y = 1;
      }
    } else {
      const avy = ob.ui.isPressed ? this.fallSlowVel : this.fallFastVel;
      this.actor.vel.y += (avy - this.actor.vel.y) * this.fallRatio;
    }
  }
}

export class ReflectByWall extends Module {
  constructor(actor: ob.Actor) {
    super(actor);
  }

  update() {
    let collisionInfo: any = { dist: 999 };
    _.forEach(this.actor.testCollision('wall'), (w: ob.Wall) => {
      const ci = w.getCollisionInfo(this.actor);
      if (ci.dist < collisionInfo.dist) {
        collisionInfo = ci;
      }
    });
    if (collisionInfo.wall == null) {
      return;
    }
    collisionInfo.wall.adjustPos(this.actor, collisionInfo.angle);
    if (collisionInfo.angle === 0 || collisionInfo.angle === 2) {
      this.actor.vel.x *= -1;
    }
    if (collisionInfo.angle === 1 || collisionInfo.angle === 3) {
      this.actor.vel.y *= -1;
    }
    collisionInfo.wall.destroy();
  }
}

export class DrawText extends Module {
  constructor(actor: ob.Actor, public text: string) {
    super(actor);
  }

  update() {
    ob.text.draw(this.text, this.actor.pos.x + 1, this.actor.pos.y - 3);
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
