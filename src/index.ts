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
}

function update() {
}
