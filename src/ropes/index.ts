import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from '../ob/index';

ob.init(init, initGame);
let p: p5 = ob.p;
let isRopePassed;

function init() {
  ob.setTitle('ROPES');
  ob.setSeeds(3140974);
}

function initGame() {
  ob.fillStar(64, -0.01, -0.01);
  _.times(16, i => new ob.Wall(p.createVector(i * 8 + 4, 124)));
  if (ob.scene !== ob.Scene.title) {
    new Player();
  }
  isRopePassed = false;
  new ob.DoCond(null,
    () => new Rope,
    () => ob.Actor.get('Rope').length <= 0 || ob.random.get() < 0.005
  );
}

class Player extends ob.Player {
  jow;
  score = 0;

  constructor() {
    super();
    this.pos.set(64, 64);
    this.angle = -p.HALF_PI;
    this.jow = new ob.JumpOnWall(this);
  }

  update() {
    if (this.jow.isOnWall) {
      if (this.jow.wasOnWall) {
        this.score++;
      } else {
        ob.addScore(this.score, this.pos);
        if (isRopePassed) {
          isRopePassed = false;
          ob.addScoreMultiplier();
        }
        this.score = 0;
      }
    }
    ob.text.draw(`${this.score}`, this.pos.x, this.pos.y - 10);
    super.update();
  }
}

class Rope extends ob.Actor {
  ms;
  removingTicks = 0;

  constructor() {
    super();
    this.clearModules();
    const r = ob.random.get(45, 55);
    const s = ob.random.get(0.05, 0.1 * ob.getDifficulty());
    this.ms = new ob.MoveSin(this, 'pos.y', 120 - r, r, s, p.HALF_PI);
    this.collisionType = 'enemy';
  }

  update() {
    super.update();
    const a = this.ms.angle % p.TWO_PI;
    if (a > p.HALF_PI * 0.8 && a < p.HALF_PI) {
      p.fill('#f00');
      this.collision.set(128, 3);
      isRopePassed = true;
      if (this.ticks > 180) {
        this.removingTicks = 1;
      }
    } else {
      p.fill('#fff');
      this.collision.set(0, 0);
    }
    if (a > p.HALF_PI && a < p.HALF_PI * 3) {
      this.priority = 0.8;
    } else {
      this.priority = 1.2;
    }
    let w = 4 + Math.cos(a) * 3;
    if (this.removingTicks > 0) {
      w += Math.sin(this.removingTicks * 0.3) * 10;
      if (w <= 0) {
        this.remove();
      }
      this.removingTicks++;
    }
    p.rect(0, this.pos.y - w / 2, 128, Math.round(w));
  }
}
