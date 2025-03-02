import { Aircraft } from "./interface";
import * as THREE from "three";

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
const liftForce = 0.02; // Lift effect

export function handleAircraftControls(aircraft: Aircraft) {
  // Throttle control (increase/decrease speed)
  if (keyState["ShiftLeft"]) aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  if (keyState["ControlLeft"]) aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);

  // Adjust speed based on throttle
  aircraftState.speed = maxSpeed * aircraftState.throttle;

  // Rotation Updates
  const pitchDelta = (keyState["ArrowUp"] ? -rotationSpeed : 0) + (keyState["ArrowDown"] ? rotationSpeed : 0);
  const rollDelta = (keyState["ArrowLeft"] ? rotationSpeed : 0) + (keyState["ArrowRight"] ? -rotationSpeed : 0);
  const yawDelta = (keyState["KeyA"] ? rotationSpeed : 0) + (keyState["KeyD"] ? -rotationSpeed : 0);

  aircraftState.pitch += pitchDelta;
  aircraftState.roll += rollDelta;
  aircraftState.yaw += yawDelta;

  // Apply rotation smoothly using quaternions
  const euler = new THREE.Euler(aircraftState.pitch, aircraftState.yaw, aircraftState.roll, "YXZ");
  aircraft.quaternion.setFromEuler(euler);

  // Move forward in the aircraft's direction
  const direction = new THREE.Vector3(0, 0, -1); // Default forward direction
  direction.applyQuaternion(aircraft.quaternion);
  aircraft.position.addScaledVector(direction, aircraftState.speed);

  // Smooth altitude update (simulate lift)
  aircraftState.altitude += pitchDelta * liftForce;
  aircraft.position.y = THREE.MathUtils.lerp(aircraft.position.y, aircraftState.altitude, 0.1);
}

