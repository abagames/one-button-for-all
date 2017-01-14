import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ir from 'ir';
import * as gcc from 'gcc';

import { Actor, Text } from './actor';
import Random from './random';
import * as ui from './ui';
import * as screen from './screen';
import * as text from './text';
import * as debug from './debug';
import * as util from './util';
export { Random, ui, screen, text, debug };
export * from './util';
export * from './actor';
export * from './modules/index';

declare const require: any;
export const p5 = require('p5');
export let p: p5;
export let ticks = 0;
export let score = 0;
export let scoreMultiplier = 1;
export let random: Random;
export let seedRandom: Random;
export let scene: Scene;

export let options = {
  isShowingScore: true,
  isShowingTitle: true,
  isReplayEnabled: true,
  isPlayingBgm: true,
  isLimitingColors: true,
  isEnableCapturing: false,
  screenWidth: 128,
  screenHeight: 128,
  titleScale: 3
};
let initFunc: Function;
let initGameFunc: Function;
let updateFunc: Function;
let postUpdateFunc: Function;
let onSeedChangedFunc: Function;
let title: string = 'N/A';
let titleCont: string;
let titleHue: number;
let isDebugEnabled = false;
let modules = [];
let initialStatus = { r: 0, s: 0 };
let replayScore: number;

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
  seedRandom = new Random();
  sss.init();
  ir.setOptions({
    frameCount: -1,
    isRecordingEventsAsString: true
  });
  new p5(_p => {
    p = _p;
    p.setup = setup;
    p.draw = draw;
  });
}

export function setTitle(_title: string, _titleCont: string = null) {
  title = _title;
  titleCont = _titleCont;
  let lc = 0;
  for (let i = 0; i < _title.length; i++) {
    lc += _title.charCodeAt(i);
  }
  titleHue = util.wrap(lc * 0.17, 0, 1);
  let docTitle = title;
  if (titleCont != null) {
    docTitle += ' ' + titleCont;
  }
  document.title = docTitle;
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
  if (scene === Scene.gameover || scene == Scene.title) {
    return;
  }
  let isReplay = scene === Scene.replay;
  scene = Scene.gameover;
  ticks = 0;
  sss.stopBgm();
  if (!isReplay && options.isReplayEnabled) {
    initialStatus.s = score;
    ir.recordInitialStatus(initialStatus);
    ir.saveAsUrl();
  }
}

export function addScore(v: number = 1, pos: p5.Vector = null) {
  if (scene === Scene.game || scene === Scene.replay) {
    score += v * scoreMultiplier;
    if (pos != null) {
      let s = '+';
      if (scoreMultiplier <= 1) {
        s += `${v}`;
      } else if (v <= 1) {
        s += `${scoreMultiplier}`;
      } else {
        s += `${v}X${scoreMultiplier}`;
      }
      const t = new Text(s);
      t.pos.set(pos);
    }
  }
}

export function addScoreMultiplier(v: number = 1) {
  scoreMultiplier += v;
}

export function setScoreMultiplier(v: number = 1) {
  scoreMultiplier = v;
}

export function clearModules() {
  modules = [];
}

export function _addModule(module) {
  modules.push(module);
}

function setup() {
  p.noStroke();
  p.noSmooth();
  ui.init();
  Actor.init();
  initFunc();
  screen.init(options.screenWidth, options.screenHeight);
  if (options.isLimitingColors) {
    limitColors();
  }
  if (options.isEnableCapturing) {
    gcc.setOptions({
      scale: 2
    });
  }
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
  clearGameStatus();
  scene = Scene.game;
  const seed = seedRandom.getInt(9999999);
  random.setSeed(seed);
  if (options.isReplayEnabled) {
    ir.startRecord();
    initialStatus.r = seed;
  }
  if (options.isPlayingBgm) {
    sss.playBgm();
  }
  initGameFunc();
}

function clearGameStatus() {
  clearModules();
  Actor.clear();
  ppe.clear();
  ui.clearJustPressed();
  score = ticks = 0;
  scoreMultiplier = 1;
}

function beginTitle() {
  scene = Scene.title;
  ticks = 0;
}

function beginReplay() {
  if (options.isReplayEnabled) {
    const status = ir.startReplay();
    if (status !== false) {
      clearGameStatus();
      scene = Scene.replay;
      random.setSeed(status.r);
      replayScore = status.s;
      initGameFunc();
    }
  }
}

function draw() {
  screen.clear();
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
    if (scoreMultiplier > 1) {
      text.draw(`X${scoreMultiplier}`, 127, 1, text.Align.right);
    }
  }
  drawSceneText();
  if (options.isEnableCapturing) {
    gcc.capture(screen.canvas);
  }
  ticks++;
}

function handleScene() {
  if ((scene === Scene.title && ui.isJustPressed) ||
    (scene === Scene.replay && ui._isPressedInReplay)) {
    beginGame();
  }
  if (scene === Scene.gameover &&
    (ticks >= 60 || (ticks >= 20 && ui.isJustPressed))) {
    beginTitle();
  }
  if (options.isReplayEnabled && scene === Scene.title && ticks >= 120) {
    beginReplay();
  }
  if (scene === Scene.replay) {
    const events = ir.getEvents();
    if (events !== false) {
      ui.updateInReplay(events);
    } else {
      beginTitle();
    }
  } else {
    ui.update();
    if (options.isReplayEnabled && scene === Scene.game) {
      ir.recordEvents(ui.getReplayEvents());
    }
  }
}

function drawSceneText() {
  switch (scene) {
    case Scene.title:
      if (titleCont == null) {
        text.drawScaled
          (title, options.titleScale, screen.size.x / 2, screen.size.y * 0.45, titleHue);
      } else {
        text.drawScaled
          (title, options.titleScale, screen.size.x / 2, screen.size.y * 0.35, titleHue);
        text.drawScaled
          (titleCont, options.titleScale, screen.size.x / 2, screen.size.y * 0.5, titleHue);
      }
      break;
    case Scene.gameover:
      text.draw('GAME OVER', screen.size.x / 2, screen.size.y * 0.45);
      break;
    case Scene.replay:
      if (ticks < 60) {
        text.draw('REPLAY', screen.size.x / 2, screen.size.y * 0.4);
        text.draw(`SCORE:${replayScore}`, screen.size.x / 2, screen.size.y * 0.5);
      } else {
        text.draw('REPLAY', 0, screen.size.y - 6, text.Align.left);
      }
      break;
  }
}

function limitColors() {
  pag.setDefaultOptions({
    isLimitingColors: true
  });
  ppe.setOptions({
    isLimitingColors: true
  });
}
