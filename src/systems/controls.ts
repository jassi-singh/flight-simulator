import * as THREE from "three";
import { Aircraft } from "../utils/types";
import { aircraftState } from "./physics";
import { shootBullet } from "./weapons";

// Tracks the state of key presses
const keyState: Record<string, boolean> = {};

// Listen for key presses
window.addEventListener("keydown", (event) => (keyState[event.code] = true));
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

/** Handle user input */
function handleInput(aircraft: Aircraft, scene: THREE.Scene) {
  // Throttle control (W/S)
  if (keyState["KeyW"]) aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  if (keyState["KeyS"]) aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);

  // Pitch Control (Arrow Up/Down)
  if (keyState["ArrowUp"]) {
    const minPitch = aircraftState.isOnGround ? 0 : Math.PI / 2;
    aircraftState.pitch = Math.min(minPitch, aircraftState.pitch + aircraftState.rotationSpeed);
  }

  if (keyState["ArrowDown"]) {
    aircraftState.pitch = Math.max(-Math.PI / 2, aircraftState.pitch - aircraftState.rotationSpeed);
  }

  // Roll Control (Arrow Left/Right)
  if (!aircraftState.isOnGround) {
    if (keyState["ArrowLeft"]) {
      aircraftState.roll = Math.max(-Math.PI / 2, aircraftState.roll - aircraftState.rotationSpeed);
      aircraftState.yaw += aircraftState.rotationSpeed * 0.5; // Add yaw when rolling
    }
    if (keyState["ArrowRight"]) {
      aircraftState.roll = Math.min(Math.PI / 2, aircraftState.roll + aircraftState.rotationSpeed);
      aircraftState.yaw -= aircraftState.rotationSpeed * 0.5; // Add yaw when rolling
    }
  }

  // If no roll input, gradually reset roll to neutral
  if (!keyState["ArrowLeft"] && !keyState["ArrowRight"]) {
    aircraftState.roll *= 0.95; // Slowly return to zero
  }

  // Shoot bullets (Space)
  if (keyState["Space"]) {
    shootBullet(aircraft, scene);
    // Add recoil to the aircraft by nosing down
    aircraftState.pitch += aircraftState.rotationSpeed * 0.2;
  }

  // Yaw Control (A/D) - Turn left/right
  if (aircraftState.isOnGround) {
    if (keyState["ArrowLeft"] || keyState["KeyA"]) aircraftState.yaw += aircraftState.rotationSpeed; // Direct turn on ground
    if (keyState["ArrowRight"] || keyState["KeyD"]) aircraftState.yaw -= aircraftState.rotationSpeed;
  }
}

/** Update aircraft movement */
export function handleAircraftControls(aircraft: Aircraft, scene: THREE.Scene) {
  handleInput(aircraft, scene); // Read input
  aircraftState.updateSpeed();
  aircraftState.applyPhysics();

  // Apply aircraft rotation
  const euler = new THREE.Euler(aircraftState.pitch, aircraftState.yaw, aircraftState.roll, "YXZ");
  aircraft.quaternion.setFromEuler(euler);

  // Move forward in the direction the aircraft is facing
  const direction = new THREE.Vector3();
  aircraft.getWorldDirection(direction);
  direction.normalize();

  // Move in the direction the aircraft is facing
  aircraft.position.addScaledVector(direction, aircraftState.speed);

  // Update aircraft altitude
  aircraft.position.y = aircraftState.altitude;
}
