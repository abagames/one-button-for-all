import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from '../index';

export class Player extends ob.Actor {
  constructor() {
    super();
    this.pixels = pag.generate(['x x', ' xxx'], { hue: 0.2 });
    this.type = 'player';
  }

  update() {
    super.update();
    if (this.testCollision('enemy').length > 0) {
      this.remove();
    }
  }
}

export class Enemy extends ob.Actor {
  constructor() {
    super();
    this.pixels = pag.generate([' xx', 'xxxx'], { hue: 0 });
    this.type = 'enemy';
  }

  update() {
    super.update();
  }
}

export class Star extends ob.Actor {
  color;

  constructor() {
    super();
    this.pos.set(ob.p.random(ob.screen.size.x), ob.p.random(ob.screen.size.y));
    this.vel.y = ob.p.random(0.5, 1.5);
    this.addModule(new ob.m.WrapPos(this));
    const colorStrs = ['00', '7f', 'ff'];
    this.color = '#' + _.times(3, () => colorStrs[Math.floor(ob.p.random(3))]).join('');
  }

  update() {
    super.update();
    ob.p.fill(this.color);
    ob.p.rect(Math.floor(this.pos.x), Math.floor(this.pos.y), 2, 2);
  }
}
