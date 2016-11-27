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
    this.emitParticles('t_pl');
    super.update();
    if (this.testCollision('enemy').length > 0) {
      sss.play('u_pl_d');
      this.emitParticles('e_pl_d', { sizeScale: 2 });
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
    this.emitParticles('t_en');
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


export class Text extends ob.Actor {
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
