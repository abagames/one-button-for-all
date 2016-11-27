import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as ir from 'ir';
import * as s1 from './index';
import * as screen from './screen';

let p5;
const rotationNum = 16;

export default class Actor {
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
  context: CanvasRenderingContext2D = screen.context;
  replayPropertyNames: string[];
  modules: any[] = [];

  constructor() {
    Actor.add(this);
    this.type = ('' + this.constructor).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
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
    p5 = s1.p5;
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

  static update() {
    Actor.actors.sort((a, b) => a.priority - b.priority);
    for (let i = 0; i < Actor.actors.length;) {
      const a = Actor.actors[i];
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
