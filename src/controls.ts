import { Aircraft } from "./interface";

const keyState: Record<string, boolean> = {};

window.addEventListener("keydown", (event) => (keyState[event.code] = true));
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

// Aircraft state
const aircraftState = {
  speed: 0,
  altitude: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  throttle: 0,
};

const maxSpeed = 2;
const rotationSpeed = 0.02;
//const liftForce = 0.02; // Lift effect



export function handleAircraftControls(aircraft: Aircraft) {
  // Throttle control (increase/decrease speed)
  if (keyState["ShiftLeft"]) aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  if (keyState["ControlLeft"]) aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);

  if (keyState["ArrowUp"]) aircraftState.pitch = Math.max(-1, aircraftState.pitch - rotationSpeed); // Nose up
  if (keyState["ArrowDown"]) aircraftState.pitch = Math.min(1, aircraftState.pitch + rotationSpeed); // Nose down

  if (keyState["ArrowLeft"]) aircraftState.roll = Math.min(1, aircraftState.roll + rotationSpeed); // Roll left
  if (keyState["ArrowRight"]) aircraftState.roll = Math.max(-1, aircraftState.roll - rotationSpeed); // Roll right

  aircraftState.yaw += aircraftState.roll * rotationSpeed * 0.5;

  aircraftState.speed = maxSpeed * aircraftState.throttle;

  // Apply rotations
  aircraft.rotation.x = aircraftState.pitch;
  aircraft.rotation.z = aircraftState.roll;
  //aircraft.rotation.y = aircraftState.yaw;
}


