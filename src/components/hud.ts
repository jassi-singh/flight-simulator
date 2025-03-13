import { getCurrentAircraftState } from '../systems/physics';

export function updateHud() {
  const state = getCurrentAircraftState();

  updateElement('speed', state.speed.toFixed(2));
  updateElement('altitude', state.altitude.toFixed(2));
  updateElement('throttle', state.throttle.toFixed(2));
  updateElement('pitch', state.pitch.toFixed(2));
  updateElement('roll', state.roll.toFixed(2));
  updateElement('yaw', state.yaw.toFixed(2));
}

function updateElement(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = value;
  }
}
