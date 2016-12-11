import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from './ob/index';

ob.init(init, initGame);
let p: p5 = ob.p;
let player: Player;

function init() {
  ob.screen.init(128, 128);
  ob.setTitle('ONE BUTTON', 'FOR ALL');
  ob.setOptions({
    isReplayEnabled: true
  });
  ob.setSeeds(8850148);
  //ob.enableDebug();
  ob.limitColors();
}

function initGame() {
  ob.fillStar();
  player = new Player();
  if (ob.scene === ob.Scene.title) {
    player.remove();
  }
  enemyMove = new EnemyMove();
  bulletPattern = new BulletPattern();
  new ob.DoInterval(null, () => {
    enemyMove = new EnemyMove();
    bulletPattern = new BulletPattern();
  }, 60 * 5);
  new ob.DoInterval(null, () => {
    new Enemy();
  }, 60, false, true);
}

class Player extends ob.Player {
  ms;
  nextAsAngle = p.HALF_PI;
  weaponType = 0;

  constructor() {
    super();
    this.ms = new ob.MoveSin(this, 'pos.x');
    this.pos.y = 110;
    this.angle = -p.HALF_PI;
  }

  update() {
    this.ms.speed = ob.ui.isPressed ? 0.1 : 0.03;
    if (this.ms.angle >= this.nextAsAngle) {
      ob.addScore(1, this.pos);
      this.nextAsAngle += p.PI;
      sss.play('c1');
    }
    if (ob.ui.isJustPressed) {
      switch (this.weaponType) {
        case 0:
          if (ob.Actor.get('napalm').length < 3) {
            new Napalm(this);
          }
          break;
        case 1:
          if (ob.Actor.get('laser').length < 1) {
            new Laser();
          }
          break;
        case 2:
          if (ob.Actor.get('wave').length < 2) {
            new Wave(this);
          }
          break;
      }
    }
    super.update();
  }

  changeWeapon(type) {
    this.weaponType = type;
  }
}

class Napalm extends ob.Shot {
  constructor(actor) {
    super(actor);
    this.type = 'napalm';
  }

  destroy() {
    new Explosion(this);
    super.destroy();
  }
}

class Explosion extends ob.Actor {
  radius = 0;
  colors = ['#fff', '#f88', '#88f'];

  constructor(actor) {
    super();
    this.pos.set(actor.pos);
    this.collisionType = 'shot';
    this.priority = 0.6;
    sss.play('e_ex');
  }

  update() {
    this.radius += this.ticks < 30 ? 1.5 : -1.5;
    this.collision.set(this.radius, this.radius);
    p.fill(this.colors[ob.random.getInt(3)]);
    p.ellipse(this.pos.x, this.pos.y, this.radius, this.radius);
    if (this.ticks >= 60) {
      this.remove();
    }
    super.update();
  }

  destroy() { }
}

class Laser extends ob.Actor {
  constructor() {
    super();
    this.collisionType = 'shot';
    this.type = 'laser';
    this.priority = 0.6;
    sss.play('l_ls');
    sss.play('s_ls');
    this.pos.y = player.pos.y / 2;
  }

  update() {
    this.pos.x = player.pos.x;
    let w = (1 - this.ticks / 30) * 20;
    let br = this.ticks < 10 ? 1 - this.ticks / 50 : 0.3 - this.ticks / 100;
    const rb = Math.floor(50 + br * 200);
    const g = Math.floor(200 + br * 50);
    p.fill(`rgb(${rb},${g},${rb})`);
    p.rect(this.pos.x - w / 2, 0, w, player.pos.y);
    if (this.ticks < 10) {
      this.collision.set(w, this.pos.y * 2);
    } else {
      this.collision.set(0, 0);
    }
    if (this.ticks >= 30) {
      this.remove();
    }
    super.update();
  }

  destroy() { }
}

class Wave extends ob.Shot {
  constructor(actor) {
    super(actor, 3);
    this.type = 'wave';
    this.pixels = pag.generate(['oooo', 'oxxx'],
      { isMirrorX: true, isMirrorY: false, hue: 0.4, rotationNum: 1 });
    this.collision.set(16, 4);
  }

  destroy() { }
}

let enemyMove: EnemyMove;
let bulletPattern: BulletPattern;

class Enemy extends ob.Enemy {
  bulletPattern: BulletPattern;

  constructor() {
    super();
    this.pos.x = ob.random.get(16, 128 - 16);
    if (enemyMove.isYSin) {
      new ob.MoveSin(this, 'pos.y', 0, 64, ob.random.get(0.015, 0.03));
    } else {
      this.vel.y = ob.random.get(1, ob.getDifficulty());
    }
    if (enemyMove.isXSin) {
      this.vel.x = ob.random.get(ob.getDifficulty() - 1) * ob.random.getPm();
    } else {
      const w = ob.random.get(1, ob.getDifficulty()) * 16;
      new ob.MoveSin(this, 'pos.x', ob.random.get(16 + w, 128 - 16 - w), w, ob.random.get(0.03, 0.05));
    }
    this.angle = p.HALF_PI;
    this.bulletPattern = bulletPattern;
    new ob.DoInterval(this, (di) => {
      if (this.pos.y < 50) {
        this.bulletPattern.fire(this);
      }
    }, 60, true, true);
  }

  destroy() {
    if (ob.random.get() < 0.1) {
      new WeaponItem(this.pos);
    }
    super.destroy();
  }
}

class EnemyMove {
  isXSin: boolean;
  isYSin: boolean;

  constructor() {
    this.isYSin = ob.random.get() < 1 / ob.getDifficulty();
    this.isXSin = ob.random.get() > 1 / ob.getDifficulty();
  }
}

class BulletPattern {
  way: number;
  angle: number;
  whip: number;
  speed: number;

  constructor() {
    this.way = ob.random.getInt(1, ob.getDifficulty() * 2);
    this.angle = ob.random.get(ob.getDifficulty() * p.HALF_PI / 4);
    this.whip = ob.random.getInt(1, ob.getDifficulty());
    this.speed = ob.random.get(ob.getDifficulty() / 4);
  }

  fire(actor) {
    let a = ob.Vector.getAngle(actor.pos, player.pos);
    let va = 0;
    if (this.way > 1) {
      a += this.angle;
      va = this.angle * 2 / (this.way - 1);
    }
    _.times(this.way, i => {
      let s = 1;
      let vs = 0;
      if (this.whip > 1) {
        s += this.speed;
        vs = this.speed * 2 / (this.whip - 1);
      }
      _.times(this.whip, () => {
        new Bullet(actor, s * 2, a);
        s -= vs;
      });
      a -= va;
    });
  }
}

class Bullet extends ob.Bullet {
  constructor(enemy, speed, angle) {
    super(enemy, speed, angle);
    this.collision.set(4, 4);
  }

  update() {
    super.update();
    const ss = this.testCollision('shot');
    if (ss.length > 0) {
      this.emitParticles('e_bl', { sizeScale: 0.5 });
      new Bonus(this.pos);
      //ob.addScore(1, this.pos);
      this.remove();
      _.forEach(ss, s => {
        if (s.type === 'napalm') {
          s.destroy();
        }
      });
    }
  }
}

class Bonus extends ob.Item {
  constructor(pos) {
    super(pos, p.createVector(0, -1), p.createVector(0, 0.02));
    this.clearModules();
    new ob.RemoveWhenOut(this, 8, null, null, null, 9999);
    new ob.AbsorbPos(this);
  }
}

class WeaponItem extends ob.Item {
  weaponType: number;

  constructor(pos) {
    super(pos, p.createVector(0, -1), p.createVector(0, 0.02));
    this.pixels = pag.generate(['oo', 'ox'], { isMirrorX: true, hue: 0.4, value: 0.5 });
    this.clearModules();
    new ob.RemoveWhenOut(this, 8, null, null, null, 9999);
    new ob.AbsorbPos(this);
    this.weaponType = ob.random.getInt(3);
    const texts = ['N', 'L', 'W'];
    new ob.DrawText(this, texts[this.weaponType]);
  }

  destroy() {
    player.changeWeapon(this.weaponType);
    super.destroy();
  }
}
