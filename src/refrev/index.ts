import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from '../ob/index';

ob.init(init, initGame);
let p: p5 = ob.p;
let player: Player;

function init() {
  ob.setTitle('REFREV');
  ob.setSeeds(8761924);
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
  mr;
  weaponType = 0;
  weaponLevel = 1;

  constructor() {
    super();
    this.mr = new ob.MoveRoundTrip(this, 'pos.x');
    this.pos.y = 110;
    this.angle = -p.HALF_PI;
  }

  update() {
    this.mr.speed = ob.ui.isPressed ? 3 : 1;
    if (ob.ui.isJustPressed) {
      switch (this.weaponType) {
        case 0:
          if (ob.Actor.get('napalm').length < 3) {
            new Napalm(this, this.weaponLevel);
          }
          break;
        case 1:
          if (ob.Actor.get('laser').length < 1) {
            new Laser(this.weaponLevel);
          }
          break;
        case 2:
          if (ob.Actor.get('wave').length < 2) {
            new Wave(this, this.weaponLevel);
          }
          break;
      }
    }
    super.update();
  }

  changeWeapon(type) {
    this.weaponType = type;
    if (this.weaponLevel < 10) {
      this.weaponLevel++;
    }
    const name = ['NAPALM', 'LASER', 'WAVE'];
    let nt = new ob.Text(name[type], 60);
    nt.pos.set(this.pos.x, this.pos.y - 4);
    let lt = new ob.Text(`LV${this.weaponLevel}`, 60);
    lt.pos.set(this.pos.x, this.pos.y + 4);
  }
}

class Napalm extends ob.Shot {
  constructor(actor, public level: number) {
    super(actor);
    this.type = 'napalm';
  }

  destroy() {
    new Explosion(this, this.level);
    super.destroy();
  }
}

class Explosion extends ob.Actor {
  radius = 0;
  colors = ['#7f7', '#070'];

  constructor(actor, public level: number) {
    super();
    this.pos.set(actor.pos);
    this.collisionType = 'shot';
    this.priority = 0.3;
    sss.play('e_ex');
  }

  update() {
    this.radius += this.ticks < 30 ? 1 + this.level * 0.1 : -1 - this.level * 0.1;
    this.collision.set(this.radius, this.radius);
    p.fill(this.colors[ob.random.getInt(2)]);
    p.ellipse(this.pos.x, this.pos.y, this.radius, this.radius);
    if (this.ticks >= 60) {
      this.remove();
    }
    super.update();
  }

  destroy() { }
}

class Laser extends ob.Actor {
  constructor(public level: number) {
    super();
    this.collisionType = 'shot';
    this.type = 'laser';
    this.priority = 0.3;
    sss.play('l_ls');
    sss.play('s_ls');
    this.pos.y = player.pos.y / 2;
  }

  update() {
    this.pos.x = player.pos.x;
    let w = (1 - this.ticks / 30) * (15 + this.level * 1.8);
    if (this.ticks < 11) {
      p.fill('#7f7');
      this.collision.set(w, this.pos.y * 2);
    } else {
      if (this.ticks === 11) {
        _.times(16, i => {
          ppe.emit('m_ls', this.pos.x, player.pos.y / 16 * i, -p.HALF_PI,
            { hue: 0.4, countScale: 0.5 });
        });
      }
      p.fill('#070');
      this.collision.set(0, 0);
    }
    p.rect(this.pos.x - w / 2, 0, w, player.pos.y);
    if (this.ticks >= 30) {
      this.remove();
    }
    super.update();
  }

  destroy() { }
}

class Wave extends ob.Shot {
  width: number;
  colors = ['#7f7', '#070'];

  constructor(actor, public level: number) {
    super(actor, 3);
    this.type = 'wave';
    this.pixels = null;
    this.width = 12 + level * 1.5;
    this.collision.set(this.width, 4);
  }

  update() {
    super.update();
    p.fill(this.colors[ob.random.getInt(2)]);
    p.rect(this.pos.x - this.width / 2, this.pos.y - 2, this.width, 4);
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
      this.vel.x = ob.random.get(ob.getDifficulty() - 1) * ob.random.getPm() * 0.5;
    } else {
      const w = ob.random.get(ob.getDifficulty() - 1) * 16;
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
    if (ob.random.get() < 0.12) {
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
    this.way = ob.random.getInt(1, ob.getDifficulty());
    this.angle = ob.random.get(ob.getDifficulty() * p.HALF_PI * 0.2);
    this.whip = ob.random.getInt(1, ob.getDifficulty() * 2);
    this.speed = ob.random.get(ob.getDifficulty() * 0.1);
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

  destroy() {
    ob.addScoreMultiplier();
    this.remove();
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
    this.priority = 0.7;
  }

  destroy() {
    player.changeWeapon(this.weaponType);
    this.remove();
  }
}
