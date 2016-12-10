import * as ob from './index';

export let isPressed = false;
export let isJustPressed = false;
export let _isPressedInReplay = false;

export function update() {
  const pp = isPressed;
  isPressed = ob.p.keyIsPressed || ob.p.mouseIsPressed;
  isJustPressed = (!pp && isPressed);
}

export function updateInReplay(events) {
  const pp = isPressed;
  _isPressedInReplay = ob.p.keyIsPressed || ob.p.mouseIsPressed;
  isPressed = events === '1';
  isJustPressed = (!pp && isPressed);
}

export function clearJustPressed() {
  isJustPressed = false;
  isPressed = true;
}

export function getReplayEvents() {
  return isPressed ? '1' : '0';
}
