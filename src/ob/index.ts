import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ir from 'ir';

import { Actor, Text } from './actor';
import Random from './random';
import * as ui from './ui';
import * as screen from './screen';
import * as text from './text';
import * as debug from './debug';
export * from './util';
export * from './actor';
export * from './modules/index';
export { Random, ui, screen, text, debug };

declare const require: any;
export const p5 = require('p5');
export let p: p5;
export let ticks = 0;
export let score = 0;
export let random: Random;
export let scene: Scene;

let options = {
  isShowingScore: true,
  isShowingTitle: true,
  isReplayEnabled: false,
  isPlayingBgm: true
};
let initFunc: Function;
let initGameFunc: Function;
let updateFunc: Function;
let postUpdateFunc: Function;
let onSeedChangedFunc: Function;
let actorGeneratorFunc: Function;
let getReplayStatusFunc: Function;
let setReplayStatusFunc: Function;
let title: string = 'N/A';
let titleCont: string;
let isDebugEnabled = false;
let modules = [];

export enum Scene {
  title, game, gameover, replay
};

export function init
  (_initFunc: () => void, _initGameFunc: () => void, _updateFunc: () => void = null,
  _postUpdateFunc: () => void = null) {
  initFunc = _initFunc;
  initGameFunc = _initGameFunc;
  updateFunc = _updateFunc;
  postUpdateFunc = _postUpdateFunc;
  random = new Random();
  sss.init();
  new p5(_p => {
    p = _p;
    p.setup = setup;
    p.draw = draw;
    p.mousePressed = () => {
      sss.playEmpty();
    };
  });
}

export function setTitle(_title: string, _titleCont: string = null) {
  title = _title;
  titleCont = _titleCont;
}

export function setReplayFuncs(
  _actorGeneratorFunc: (type: string, status: any) => void,
  _getReplayStatusFunc: () => any = null,
  _setReplayStatusFunc: (status: any) => void = null) {
  options.isReplayEnabled = true;
  actorGeneratorFunc = _actorGeneratorFunc;
  getReplayStatusFunc = _getReplayStatusFunc;
  setReplayStatusFunc = _setReplayStatusFunc;
}

export function enableDebug(_onSeedChangedFunc = null) {
  onSeedChangedFunc = _onSeedChangedFunc;
  debug.initSeedUi(setSeeds);
  debug.enableShowingErrors();
  isDebugEnabled = true;
}

export function setOptions(_options) {
  for (let attr in _options) {
    options[attr] = _options[attr];
  }
}

export function setSeeds(seed: number) {
  pag.setSeed(seed);
  ppe.setSeed(seed);
  ppe.reset();
  sss.reset();
  sss.setSeed(seed);
  if (scene === Scene.game) {
    sss.playBgm();
  }
  if (onSeedChangedFunc != null) {
    onSeedChangedFunc();
  }
}

export function endGame() {
  if (scene === Scene.gameover) {
    return;
  }
  let isReplay = scene === Scene.replay;
  scene = Scene.gameover;
  ticks = 0;
  sss.stopBgm();
  if (!isReplay && options.isReplayEnabled) {
    ir.saveAsUrl();
  }
}

export function addScore(v: number = 1, pos: p5.Vector = null) {
  if (scene === Scene.game || scene === Scene.replay) {
    score += v;
    if (pos != null) {
      const t = new Text(`+${v}`);
      t.pos.set(pos);
    }
  }
}

export function clearModules() {
  modules = [];
}

export function _addModule(module) {
  modules.push(module);
}

function setup() {
  Actor.init();
  initFunc();
  if (isDebugEnabled || !options.isShowingTitle) {
    beginGame();
  } else {
    if (options.isReplayEnabled && ir.loadFromUrl() === true) {
      beginReplay();
    } else {
      beginTitle();
      initGameFunc();
    }
  }
}

function beginGame() {
  scene = Scene.game;
  score = ticks = 0;
  if (options.isPlayingBgm) {
    sss.playBgm();
  }
  ir.startRecord();
  clearModules();
  Actor.clear();
  ppe.clear();
  ui.clearJustPressed();
  initGameFunc();
}

function beginTitle() {
  scene = Scene.title;
  ticks = 0;
}

function beginReplay() {
  const status = ir.startReplay();
  if (status !== false) {
    scene = Scene.replay;
    Actor.clear();
    initGameFunc();
    setStatus(status);
  }
}

function draw() {
  screen.clear();
  ui.update();
  handleScene();
  sss.update();
  if (updateFunc != null) {
    updateFunc();
  }
  _.forEach(modules, m => {
    m.update();
  });
  Actor.updateLowerZero();
  ppe.update();
  Actor.update();
  if (postUpdateFunc != null) {
    postUpdateFunc();
  }
  if (options.isShowingScore) {
    text.draw(`${score}`, 1, 1, text.Align.left);
  }
  drawSceneText();
  ticks++;
}

function handleScene() {
  if (scene === Scene.title && ui.isJustPressed) {
    beginGame();
  }
  if (options.isReplayEnabled && scene === Scene.game) {
    ir.record(getStatus(), ui.getReplayEvents());
  }
  if (scene === Scene.gameover && (ticks === 60 || ui.isJustPressed)) {
    beginTitle();
  }
  if (options.isReplayEnabled && scene === Scene.title && ticks === 120) {
    beginReplay();
  }
  if (scene === Scene.replay) {
    const events = ir.getEvents();
    if (events !== false) {
      ui.setReplayEvents(events);
    } else {
      beginTitle();
    }
  }
}

function drawSceneText() {
  switch (scene) {
    case Scene.title:
      if (titleCont == null) {
        text.draw(title, screen.size.x / 2, screen.size.y * 0.48);
      } else {
        text.draw(title, screen.size.x / 2, screen.size.y * 0.4);
        text.draw(titleCont, screen.size.x / 2, screen.size.y * 0.48);
      }
      break;
    case Scene.gameover:
      text.draw('GAME OVER', screen.size.x / 2, screen.size.y * 0.45);
      break;
    case Scene.replay:
      text.draw('REPLAY', screen.size.x / 2, screen.size.y * 0.55);
      break;
  }
}

function getStatus() {
  const status = [ticks, score, random.getStatus(), Actor.getReplayStatus()];
  if (getReplayStatusFunc != null) {
    status.push(getReplayStatusFunc());
  }
  return status;
}

function setStatus(status) {
  Actor.setReplayStatus(status[3], actorGeneratorFunc);
  if (setReplayStatusFunc != null) {
    setReplayStatusFunc(status[4]);
  }
  ticks = status[0];
  score = status[1];
  random.setStatus(status[2]);
}
