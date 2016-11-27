import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ob from './ob/index';

ob.init(init, initGame, update);
let p: p5 = ob.p;
let m = ob.m;

function init() {
  ob.screen.init(128, 128);
  ob.setTitle('ONE BUTTON', 'FOR ALL');
  //ob.setReplayFuncs(generateActor, getReplayStatus, setReplayStatus);
  //ob.setSeeds(0);
  ob.enableDebug(() => {
  });
  pag.setDefaultOptions({
    isLimitingColors: true
  });
  ppe.setOptions({
    isLimitingColors: true
  });
}

function initGame() {
  _.times(64, () => new m.Actor.Star());
  new Player();
  ob.addModule(new m.DoInterval(null, () => {
    new Enemy()
  }, 60, false, true));
}

function update() {
}

class Player extends m.Actor.Player {
  ms;

  constructor() {
    super();
    this.ms = new m.MoveSin(this, 'pos.x');
    this.addModule(this.ms);
    this.pos.y = 100;
    this.angle = -p.HALF_PI;
  }

  update() {
    this.ms.speed = ob.ui.isPressed ? 0.1 : 0.03;
    super.update();
  }
}

class Enemy extends m.Actor.Enemy {
  constructor() {
    super();
    this.pos.x = p.random(128);
    this.vel.y = p.random(1, m.getDifficulty());
    this.addModule(new m.RemoveWhenOut(this))
    this.angle = p.HALF_PI;
  }
}
