import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from '../ob/index';

ob.init(init, initGame, update);
let p: p5 = ob.p;
let enemiesCount: number;

function init() {
  ob.setTitle('INVORB');
  ob.setSeeds(3593533);
}

function initGame() {
  ob.fillStar(64, 0.01, 0.01);
  if (ob.scene !== ob.Scene.title) {
    new Player();
    new Earth();
  }
  enemiesCount = 1;
}

function update() {
  if (ob.Actor.get('enemy').length <= 0) {
    _.times(enemiesCount, () => new Enemy());
    if (enemiesCount < 16) {
      enemiesCount++;
    }
  }
}

class Player extends ob.Player {
  msx;
  msy;

  constructor() {
    super();
    const radius = 15;
    this.msx = new ob.MoveSin(this, 'pos.x', 64, radius, 0, 0);
    this.msy = new ob.MoveSin(this, 'pos.y', 64, radius, 0, -p.HALF_PI);
    this.collision.set(3, 3);
  }

  update() {
    this.angle = this.msy.angle;
    this.msx.speed = this.msy.speed = ob.ui.isPressed ? 0.1 : 0.02
    if (ob.ui.isJustPressed) {
      new Shot(this);
    }
    super.update();
  }
}

class Shot extends ob.Shot {
  constructor(player) {
    super(player, 1);
    new ob.HaveGravity(this);
    new ob.LimitInstances(this, 3);
  }
}

class Earth extends ob.Actor {
  radius = 10;
  hg;

  constructor() {
    super();
    this.hg = new ob.HaveGravity(this);
    this.pos.set(64, 64);
  }

  update() {
    this.hg.mass = 3 * ob.getDifficulty();
    p.fill('#77f');
    p.ellipse(this.pos.x, this.pos.y, this.radius, this.radius);
  }
}

class Enemy extends ob.Enemy {
  constructor() {
    super();
    new ob.HaveGravity(this);
    const isUpper = ob.random.get() < 0.5;
    this.pos.set(ob.random.get(32, 96), isUpper ? -8 : 128 + 8);
    this.vel.set(ob.random.get(0.1, 0.3) * ob.random.getPm(),
      isUpper ? ob.random.get(0.1) : -ob.random.get(0.1));
    if (ob.random.get() < 0.5) {
      ob.Vector.swapXy(this.pos);
      ob.Vector.swapXy(this.vel);
    }
  }

  update() {
    this.angle = ob.Vector.getAngle(this.vel);
    super.update();
  }

  destroy() {
    sss.play(`e_${this.type}_d`);
    this.emitParticles(`e_${this.type}_d`);
    ob.addScore(Math.floor(this.pos.dist(p.createVector(64, 64))), this.pos);
    this.remove();
  }
}
