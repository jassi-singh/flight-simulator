import * as THREE from "three";
import { Aircraft } from "../utils/types";
import { aircraftState } from "./physics";
import { fireBullet } from './weapons';

// Tracks the state of key presses
const keyState: Record<string, boolean> = {};
const fireRate = 200; // Fire rate in milliseconds
let lastFireTime = 0;

// Listen for key presses
window.addEventListener("keydown", (event) => {
  keyState[event.code] = true;
});
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

/** Handle user input */
function handleInput(aircraft: Aircraft, scene: THREE.Scene) {
  // Throttle control (W/S)
  if (keyState["KeyW"]) {
    aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  }
  if (keyState["KeyS"]) {
    aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);
  }

  // INVERTED PITCH CONTROL AS REQUESTED:
  // Down Arrow = Nose Up (negative pitch)
  // Up Arrow = Nose Down (positive pitch)

  if (keyState["ArrowUp"]) {
    // Nose DOWN (positive pitch in aircraft coordinates)
    aircraftState.pitch = Math.min(Math.PI / 3, aircraftState.pitch + aircraftState.rotationSpeed);
  }

  if (keyState["ArrowDown"]) {
    // Nose UP (negative pitch in aircraft coordinates)
    // If we have sufficient speed and are on the ground, allow takeoff
    if (aircraftState.isOnGround && aircraftState.speed > 30) {
      // Allow more pitch during takeoff
      const takeoffPitchRate = aircraftState.rotationSpeed * 1.0;
      aircraftState.pitch = Math.max(-Math.PI / 8, aircraftState.pitch - takeoffPitchRate);
    } else if (!aircraftState.isOnGround) {
      // Normal flight pitch control (upward)
      aircraftState.pitch = Math.max(-Math.PI / 3, aircraftState.pitch - aircraftState.rotationSpeed);
    }
  }

  // If no pitch input, gradually return to level flight
  if (!keyState["ArrowUp"] && !keyState["ArrowDown"]) {
    aircraftState.pitch *= 0.98; // Slowly return to zero
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
    const currentTime = Date.now();
    if (currentTime - lastFireTime > fireRate) {
      lastFireTime = currentTime;

      // Get aircraft position and direction
      const direction = new THREE.Vector3();
      aircraft.getWorldDirection(direction);

      const bulletPosition = aircraft.position.clone();
      const bulletDirection = direction.clone();

      // Fire bullet from aircraft position in aircraft direction
      fireBullet(scene, bulletPosition, bulletDirection);
    }
    // Add recoil to the aircraft
    aircraftState.pitch += aircraftState.rotationSpeed * 0.2; // Changed to match inverted controls
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

  // Scale movement - divide speed by 100 for visual movement rate
  const movementSpeed = aircraftState.speed / 100;

  // Move in the direction the aircraft is facing
  aircraft.position.addScaledVector(direction, movementSpeed);

  // Update aircraft altitude - scale for visual appearance
  aircraft.position.y = aircraftState.altitude / 20;
}
