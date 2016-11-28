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
  collision: p5.Vector = new p5.Vector(8, 8);
  context: CanvasRenderingContext2D = ob.screen.context;
  replayPropertyNames: string[];
  modules: any[] = [];

  constructor() {
    Actor.add(this);
    this.type = ('' + this.constructor).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
    this.addModule(new ob.RemoveWhenOut(this));
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

  addModule(module) {
    this.modules.push(module);
  }

  clearModules() {
    this.modules = [];
  }

  testCollision(type: string) {
    return _.filter<Actor>(Actor.get(type), a =>
      Math.abs(this.pos.x - a.pos.x) < (this.collision.x + a.collision.x) / 2 &&
      Math.abs(this.pos.y - a.pos.y) < (this.collision.y + a.collision.y) / 2
    );
  }

  emitParticles(patternName: string, options: ppe.EmitOptions = {}) {
    (<any>ppe.emit)(patternName, this.pos.x, this.pos.y, this.angle, options);
  }

  drawPixels(x: number = null, y: number = null) {
    if (x == null) {
      x = this.pos.x;
    }
    if (y == null) {
      y = this.pos.y;
    }
    let a = this.angle;
    if (a < 0) {
      a = Math.PI * 2 - Math.abs(a % (Math.PI * 2));
    }
    const ri = Math.round(a / (Math.PI * 2 / rotationNum)) % rotationNum;
    pag.draw(this.context, this.pixels, x, y, ri);
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
    pag.defaultOptions.isMirrorY = true;
    pag.defaultOptions.rotationNum = rotationNum;
    pag.defaultOptions.scale = 2;
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
    this.type = 'player';
  }

  update() {
    this.emitParticles('t_pl');
    super.update();
    if (this.testCollision('enemy').length > 0) {
      this.onDestroyed();
    }
  }

  onDestroyed() {
    sss.play('u_pl_d');
    this.emitParticles('e_pl_d', { sizeScale: 2 });
    this.remove();
    ob.endGame();
  }
}

export class Enemy extends Actor {
  constructor() {
    super();
    this.pixels = pag.generate([' xx', 'xxxx'], { hue: 0 });
    this.type = 'enemy';
  }

  update() {
    this.emitParticles('t_en');
    super.update();
    const cs = this.testCollision('shot');
    if (cs.length > 0) {
      this.onDestroyed();
      _.forEach(cs, s => {
        s.remove();
      });
    }
  }

  onDestroyed() {
    sss.play('e_en_d');
    this.emitParticles('e_en_d');
    ob.addScore(1, this.pos);
    this.remove();
  }
}

export class Shot extends Actor {
  constructor(actor, speed = 2) {
    super();
    this.pixels = pag.generate(['xxx'], { hue: 0.4 });
    this.type = 'shot';
    this.pos.set(actor.pos);
    this.angle = actor.angle;
    this.speed = speed;
  }

  update() {
    this.emitParticles('t_st');
    super.update();
  }
}

export class Star extends Actor {
  color;

  constructor() {
    super();
    this.pos.set(ob.p.random(ob.screen.size.x), ob.p.random(ob.screen.size.y));
    this.vel.y = ob.p.random(0.5, 1.5);
    this.clearModules();
    this.addModule(new ob.WrapPos(this));
    const colorStrs = ['00', '7f', 'ff'];
    this.color = '#' + _.times(3, () => colorStrs[Math.floor(ob.p.random(3))]).join('');
    this.priority = -1;
  }

  update() {
    super.update();
    ob.p.fill(this.color);
    ob.p.rect(Math.floor(this.pos.x), Math.floor(this.pos.y), 2, 2);
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
