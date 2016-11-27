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
