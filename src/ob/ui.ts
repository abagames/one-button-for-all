import * as ob from './index';

export let isPressed = false;
export let isJustPressed = false;

export function update() {
  const pp = isPressed;
  isPressed = ob.p.keyIsPressed || ob.p.mouseIsPressed;
  isJustPressed = (!pp && isPressed);
}

export function getReplayEvents() {
  return [isPressed, isJustPressed];
}

export function setReplayEvents(events) {
  isPressed = events[0];
  isJustPressed = events[1];
}
