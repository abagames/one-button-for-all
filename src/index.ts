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
  new ob.DoInterval(null, () => {
    new Enemy();
  }, 60, false, true);
}

class Player extends ob.Player {
  ms;
  nextAsAngle = p.HALF_PI;

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
      new ob.Shot(this);
    }
    super.update();
  }
}

class Enemy extends ob.Enemy {
  constructor() {
    super();
    this.pos.x = ob.random.get(128);
    this.vel.y = ob.random.get(1, ob.getDifficulty());
    this.angle = p.HALF_PI;
    new ob.DoInterval(this, (di) => {
      if (this.pos.y < 50) {
        new Bullet(this);
      }
    }, 60, true, true);
    this.onDestroyed = () => {
      new Bonus(this.pos);
    };
  }
}

class Bullet extends ob.Bullet {
  constructor(enemy) {
    super(enemy);
    this.angle = ob.Vector.getAngle(enemy.pos, player.pos);
    this.collision.set(4, 4);
  }

  update() {
    super.update();
    if (this.testCollision('shot').length > 0) {
      this.emitParticles('e_bl', { sizeScale: 0.5 });
      ob.addScore(1, this.pos);
      this.remove();
    }
  }
}

class Bonus extends ob.Bonus {
  constructor(pos) {
    super(pos, p.createVector(0, -1), p.createVector(0, 0.02));
    this.clearModules();
    new ob.RemoveWhenOut(this, 8, null, null, null, 9999);
    new ob.AbsorbPos(this);
  }
}
