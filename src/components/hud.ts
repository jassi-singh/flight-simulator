import { getCurrentAircraftState } from '../systems/physics';

// DOM element IDs for HUD components
const HUD_ELEMENTS = {
  SPEED: 'speed-value',
  ALTITUDE: 'altitude-value',
  THROTTLE: 'throttle-value',
  PITCH: 'pitch-value',
  ROLL: 'roll-value',
  YAW: 'yaw-value',
  AOA: 'aoa-value',
  STALL: 'stall-warning'
};

// Initialize HUD elements if they don't exist
export function initializeHud() {
  const hudContainer = document.getElementById('hud-container');

  if (!hudContainer) {
    // Create HUD container
    const container = document.createElement('div');
    container.id = 'hud-container';
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.color = 'white';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '14px';
    container.style.textShadow = '1px 1px 1px black';
    container.style.padding = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.borderRadius = '5px';
    document.body.appendChild(container);

    // Create HUD elements
    createHudElement(container, 'SPEED', HUD_ELEMENTS.SPEED);
    createHudElement(container, 'ALTITUDE', HUD_ELEMENTS.ALTITUDE);
    createHudElement(container, 'THROTTLE', HUD_ELEMENTS.THROTTLE);
    createHudElement(container, 'PITCH', HUD_ELEMENTS.PITCH);
    createHudElement(container, 'ROLL', HUD_ELEMENTS.ROLL);
    createHudElement(container, 'YAW', HUD_ELEMENTS.YAW);
    createHudElement(container, 'AOA', HUD_ELEMENTS.AOA);

    // Create stall warning element
    const stallWarning = document.createElement('div');
    stallWarning.id = HUD_ELEMENTS.STALL;
    stallWarning.style.color = 'red';
    stallWarning.style.fontWeight = 'bold';
    stallWarning.style.display = 'none';
    stallWarning.innerText = 'STALL WARNING';
    container.appendChild(stallWarning);
  }
}

function createHudElement(container: HTMLElement, label: string, valueId: string) {
  const element = document.createElement('div');
  element.style.marginBottom = '5px';

  const labelSpan = document.createElement('span');
  labelSpan.innerText = `${label}: `;

  const valueSpan = document.createElement('span');
  valueSpan.id = valueId;
  valueSpan.innerText = '0.00';

  element.appendChild(labelSpan);
  element.appendChild(valueSpan);
  container.appendChild(element);
}

export function updateHud() {
  const state = getCurrentAircraftState();

  updateElement(HUD_ELEMENTS.SPEED, (state.speed * 100).toFixed(0) + " kts");
  updateElement(HUD_ELEMENTS.ALTITUDE, state.altitude.toFixed(0) + " ft");
  updateElement(HUD_ELEMENTS.THROTTLE, (state.throttle * 100).toFixed(0) + "%");
  updateElement(HUD_ELEMENTS.PITCH, (state.pitch * (180 / Math.PI)).toFixed(1) + "°");
  updateElement(HUD_ELEMENTS.ROLL, (state.roll * (180 / Math.PI)).toFixed(1) + "°");
  updateElement(HUD_ELEMENTS.YAW, (state.yaw * (180 / Math.PI)).toFixed(1) + "°");
  updateElement(HUD_ELEMENTS.AOA, state.getAngleOfAttack().toFixed(1) + "°");

  // Show/hide stall warning
  const stallWarning = document.getElementById(HUD_ELEMENTS.STALL);
  if (stallWarning) {
    stallWarning.style.display = state.getStallWarning() ? 'block' : 'none';

    // Make it flash when active
    if (state.getStallWarning()) {
      stallWarning.style.visibility = Math.floor(Date.now() / 500) % 2 === 0 ? 'visible' : 'hidden';
    }
  }
}

function updateElement(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = value;
  }
}
