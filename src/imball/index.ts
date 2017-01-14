import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from '../ob/index';

ob.init(init, initGame, update);
let p: p5 = ob.p;
let blockSpeed = 0;
let blockAddingDist = 0;

function init() {
  ob.setTitle('IMBALL');
  ob.setSeeds(1959778);
}

function initGame() {
  ob.fillPanel();
  _.times(14, i => {
    new ob.Wall(p.createVector(i * 8 + 4 + 9, 4))
  });
  _.times(16, i => {
    new ob.Wall(p.createVector(4, i * 8 + 4))
    new ob.Wall(p.createVector(124, i * 8 + 4))
  });
  if (ob.scene !== ob.Scene.title) {
    new Ball();
    new Racket();
  }
  blockSpeed = 0;
  blockAddingDist = 0;
  new ob.DoCond(null, () => {
    new Block();
    blockAddingDist += 10;
  }, () => blockAddingDist <= 0);
}

function update() {
  const d = _.reduce(ob.Actor.get('block'), (v, b) => v < b.pos.y ? b.pos.y : v, 0);
  blockSpeed = d > 50 ? (1 + ob.getDifficulty()) * 0.03 : (60 - d) * 0.01;
  blockAddingDist -= blockSpeed;
}

class Ball extends ob.Actor {
  isPressing = false;

  constructor() {
    super();
    this.clearModules();
    this.pixels = pag.generate([' o', 'ox'], { isMirrorX: true, hue: 0.2 });
    this.pos.set(64, 64);
    const angle = ob.random.get(-p.HALF_PI / 4 * 3, -p.HALF_PI / 2);
    ob.Vector.addAngle(this.vel, angle, 0.33);
    new ob.ReflectByWall(this);
  }

  update() {
    if (this.isPressing !== ob.ui.isPressed) {
      this.vel.mult(ob.ui.isPressed ? 4 : 0.25);
      this.isPressing = ob.ui.isPressed;
    }
    if (ob.ui.isJustPressed) {
      this.vel.x *= -1;
    }
    _.forEach(this.testCollision('racket'), (r: Racket) => {
      r.adjustPos(this, 3);
      const ox = this.pos.x - r.pos.x;
      if (Math.abs(ox) < 8) {
        this.vel.y *= -1;
      } else {
        const speed = this.vel.mag();
        const angle = ox > 0 ?
          -p.HALF_PI / 8 * 7 + (ox - 8) / 8 * p.HALF_PI / 2 :
          -p.HALF_PI / 8 * 9 - (-ox - 8) / 8 * p.HALF_PI / 2;
        this.vel.set(0, 0);
        ob.Vector.addAngle(this.vel, angle, speed);
      }
      sss.play('s_ra');
      ob.setScoreMultiplier();
    });
    if (this.pos.y > 128) {
      this.emitParticles('e_bl');
      sss.play('u_bl');
      this.remove();
      ob.endGame();
    }
    this.vel.mult(1.0003);
    super.update();
  }
}

class Racket extends ob.Wall {
  constructor() {
    super(p.createVector(64, 120), 32, 8, 0.3, 11);
    this.collisionType = 'racket';
    this.vel.set(1, 0);
  }

  update() {
    if (this.pos.x <= 24) {
      this.pos.x = 25;
      this.vel.x *= -1;
    }
    if (this.pos.x >= 128 - 24) {
      this.pos.x = 128 - 25;
      this.vel.x *= -1;
    }
    if (this.testCollision('wall').length > 0) {
      this.emitParticles('e_rk');
      sss.play('u_bl');
      this.remove();
      ob.endGame();
    }
    super.update();
  }
}

class Block extends ob.Wall {
  constructor() {
    super(p.createVector(ob.random.get(16, 112), 0), 16, 8, 0.5, 22);
    this.type = 'block';
  }

  update() {
    this.pos.y += blockSpeed;
    super.update();
  }

  destroy() {
    this.emitParticles('s_bl');
    sss.play('s_bl');
    ob.addScore(1, this.pos);
    ob.addScoreMultiplier();
    this.remove();
  }
}
