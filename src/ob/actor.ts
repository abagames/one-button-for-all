import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ir from 'ir';
import * as ob from './index';

let p5;
const rotationNum = 16;

export class Actor {
  pos: p5.Vector = new p5.Vector();
  vel: p5.Vector = new p5.Vector();
  angle = 0;
  speed = 0;
  isAlive = true;
  priority = 1;
  ticks = 0;
  pixels: pag.Pixel[][][];
  type: string;
  collisionType: string;
  collision: p5.Vector = new p5.Vector(8, 8);
  context: CanvasRenderingContext2D = ob.screen.context;
  replayPropertyNames: string[];
  modules: any[] = [];

  constructor() {
    Actor.add(this);
    this.type = ('' + this.constructor).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
    new ob.RemoveWhenOut(this);
  }

  update() {
    this.pos.add(this.vel);
    this.pos.x += Math.cos(this.angle) * this.speed;
    this.pos.y += Math.sin(this.angle) * this.speed;
    if (this.pixels != null) {
      this.drawPixels();
    }
    _.forEach(this.modules, m => {
      m.update();
    });
    this.ticks++;
  }

  remove() {
    this.isAlive = false;
  }

  destroy() {
    this.remove();
  }

  clearModules() {
    this.modules = [];
  }

  testCollision(type: string) {
    return _.filter<Actor>(Actor.getByCollitionType(type), a =>
      Math.abs(this.pos.x - a.pos.x) < (this.collision.x + a.collision.x) / 2 &&
      Math.abs(this.pos.y - a.pos.y) < (this.collision.y + a.collision.y) / 2
    );
  }

  emitParticles(patternName: string, options: ppe.EmitOptions = {}) {
    (<any>ppe.emit)(patternName, this.pos.x, this.pos.y, this.angle, options);
  }

  _addModule(module) {
    this.modules.push(module);
  }

  drawPixels(x: number = null, y: number = null) {
    if (x == null) {
      x = this.pos.x;
    }
    if (y == null) {
      y = this.pos.y;
    }
    if (this.pixels.length <= 1) {
      pag.draw(this.context, this.pixels, x, y);
    } else {
      let a = this.angle;
      if (a < 0) {
        a = Math.PI * 2 - Math.abs(a % (Math.PI * 2));
      }
      const ri = Math.round(a / (Math.PI * 2 / rotationNum)) % rotationNum;
      pag.draw(this.context, this.pixels, x, y, ri);
    }
  }

  getReplayStatus() {
    if (this.replayPropertyNames == null) {
      return null;
    }
    return ir.objectToArray(this, this.replayPropertyNames);
  }

  setReplayStatus(status) {
    ir.arrayToObject(status, this.replayPropertyNames, this);
  }

  static actors: any[];

  static init() {
    p5 = ob.p5;
    pag.setDefaultOptions({
      isMirrorY: true,
      rotationNum,
      scale: 2
    });
    Actor.clear();
  }

  static add(actor) {
    Actor.actors.push(actor);
  }

  static clear() {
    Actor.actors = [];
  }

  static updateLowerZero() {
    Actor.actors.sort((a, b) => a.priority - b.priority);
    Actor.updateSorted(true);
  }

  static update() {
    Actor.updateSorted();
  }

  static updateSorted(isLowerZero = false) {
    for (let i = 0; i < Actor.actors.length;) {
      const a = Actor.actors[i];
      if (isLowerZero && a.priority >= 0) {
        return;
      }
      if (!isLowerZero && a.priority < 0) {
        i++;
        continue;
      }
      if (a.isAlive !== false) {
        a.update();
      }
      if (a.isAlive === false) {
        Actor.actors.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  static get(type: string) {
    return _.filter<Actor>(Actor.actors, a => a.type === type);
  }

  static getByCollitionType(collitionType: string) {
    return _.filter<Actor>(Actor.actors, a => a.collisionType == collitionType);
  }

  static getReplayStatus() {
    let status = [];
    _.forEach(Actor.actors, (a: Actor) => {
      let array = a.getReplayStatus();
      if (array != null) {
        status.push([a.type, array]);
      }
    });
    return status;
  }

  static setReplayStatus(status: any[], actorGeneratorFunc) {
    _.forEach(status, s => {
      actorGeneratorFunc(s[0], s[1]);
    });
  }
}

export class Player extends Actor {
  constructor() {
    super();
    this.pixels = pag.generate(['x x', ' xxx'], { hue: 0.2 });
    this.type = this.collisionType = 'player';
    this.collision.set(5, 5);
  }

  update() {
    this.emitParticles(`t_${this.type}`);
    super.update();
    if (this.testCollision('enemy').length > 0 ||
      this.testCollision('bullet').length > 0) {
      this.destroy();
    }
  }

  destroy() {
    sss.play(`u_${this.type}_d`);
    this.emitParticles(`e_${this.type}_d`, { sizeScale: 2 });
    super.destroy();
    ob.endGame();
  }
}

export class Enemy extends Actor {
  constructor() {
    super();
    this.pixels = pag.generate([' xx', 'xxxx'], { hue: 0 });
    this.type = this.collisionType = 'enemy';
  }

  update() {
    this.emitParticles(`t_${this.type}`);
    super.update();
    const cs = this.testCollision('shot');
    if (cs.length > 0) {
      this.destroy();
      _.forEach(cs, (s: Shot) => {
        s.destroy();
      });
    }
  }

  destroy() {
    sss.play(`e_${this.type}_d`);
    this.emitParticles(`e_${this.type}_d`);
    ob.addScore(1, this.pos);
    super.destroy();
  }
}

export class Shot extends Actor {
  constructor(actor, speed = 2, angle = null) {
    super();
    this.pixels = pag.generate(['xxx'], { hue: 0.4 });
    this.type = this.collisionType = 'shot';
    this.pos.set(actor.pos);
    this.angle = angle == null ? actor.angle : angle;
    this.speed = speed;
    this.priority = 0.3;
  }

  update() {
    if (this.ticks === 0) {
      this.emitParticles(`m_${this.type}`);
      sss.play(`l_${this.type}`);
    }
    this.emitParticles(`t_${this.type}`);
    super.update();
  }
}

export class Bullet extends Actor {
  constructor(actor, speed = 2, angle = null) {
    super();
    this.pixels = pag.generate(['xxxx'], { hue: 0.1 });
    this.type = this.collisionType = 'bullet';
    this.pos.set(actor.pos);
    this.angle = angle == null ? actor.angle : angle;
    this.speed = speed;
  }

  update() {
    if (this.ticks === 0) {
      this.emitParticles(`m_${this.type}`);
      sss.play(`l_${this.type}`);
    }
    this.emitParticles(`t_${this.type}`);
    super.update();
  }
}

export class Item extends Actor {
  constructor(pos: p5.Vector, vel: p5.Vector = null, public gravity: p5.Vector = null) {
    super();
    this.pixels = pag.generate([' o', 'ox'], { isMirrorX: true, hue: 0.25 });
    this.type = this.collisionType = 'item';
    this.pos.set(pos);
    if (vel != null) {
      this.vel = vel;
    }
    this.priority = 0.6;
    this.collision.set(10, 10);
  }

  update() {
    this.vel.add(this.gravity);
    this.vel.mult(0.99);
    this.emitParticles(`t_${this.type}`);
    super.update();
    if (this.testCollision('player').length > 0) {
      this.emitParticles(`s_${this.type}`);
      sss.play(`s_${this.type}`);
      this.destroy();
    }
    super.update();
  }

  destroy() {
    ob.addScore(1, this.pos);
    super.destroy();
  }
}

export class Star extends Actor {
  color;

  constructor() {
    super();
    this.pos.set(ob.p.random(ob.screen.size.x), ob.p.random(ob.screen.size.y));
    this.vel.y = ob.p.random(0.5, 1.5);
    this.clearModules();
    new ob.WrapPos(this);
    const colorStrs = ['00', '7f', 'ff'];
    this.color = '#' + _.times(3, () => colorStrs[Math.floor(ob.p.random(3))]).join('');
    this.priority = -1;
  }

  update() {
    super.update();
    ob.p.fill(this.color);
    ob.p.rect(Math.floor(this.pos.x), Math.floor(this.pos.y), 1, 1);
  }
}

export class Panel extends Actor {
  constructor(x, y) {
    super();
    const pagOptions: any = { isMirrorX: true, value: 0.5, rotationNum: 1 };
    if (ob.options.isLimitingColors) {
      pagOptions.colorLighting = 0;
    }
    this.pixels = pag.generate(['ooo', 'oxx', 'oxx'], pagOptions);
    this.pos.set(x, y);
    new ob.WrapPos(this);
    this.vel.y = 1;
    this.priority = -1;
  }
}

export class Text extends Actor {
  constructor
    (public str: string, public duration = 30,
    public align: ob.text.Align = null) {
    super();
    this.vel.y = -2;
  }

  update() {
    super.update();
    this.vel.mult(0.9);
    ob.text.draw(this.str, this.pos.x, this.pos.y, this.align);
    if (this.ticks >= this.duration) {
      this.remove();
    }
  }
}
