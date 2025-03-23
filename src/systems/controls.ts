import * as THREE from "three";
import { Aircraft } from "../utils/types";
import { aircraftState } from "./physics";
import { fireBullet } from './weapons';
import gameState from "../utils/game-state";

// Tracks the state of key presses
const keyState: Record<string, boolean> = {};
const fireRate = 200; // Fire rate in milliseconds
let lastFireTime = 0;

// Touch control state
const touchState = {
  throttleUp: false,
  throttleDown: false,
  pitchUp: false,
  pitchDown: false,
  rollLeft: false,
  rollRight: false,
  fire: false,
  yawLeft: false,
  yawRight: false,
  touchStartY: 0,
  touchStartX: 0,
};

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Listen for key presses
window.addEventListener("keydown", (event) => {
  keyState[event.code] = true;
});
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

// Initialize mobile controls if on a mobile device
function initMobileControls() {
  if (!isMobile) return;

  // Create mobile UI
  createMobileUI();

  // Setup touch listeners for the mobile controls
  setupTouchListeners();
}

// Create mobile UI elements
function createMobileUI() {
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'mobile-controls';
  controlsContainer.style.position = 'fixed';
  controlsContainer.style.bottom = '10px';
  controlsContainer.style.left = '0';
  controlsContainer.style.right = '0';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.justifyContent = 'space-between';
  controlsContainer.style.pointerEvents = 'none';
  document.body.appendChild(controlsContainer);

  // Left side controls (throttle and fire)
  const leftControls = document.createElement('div');
  leftControls.id = 'left-controls';
  leftControls.style.display = 'flex';
  leftControls.style.flexDirection = 'column';
  leftControls.style.marginLeft = '20px';
  leftControls.style.pointerEvents = 'auto';
  controlsContainer.appendChild(leftControls);

  // Throttle controls
  const throttleControls = document.createElement('div');
  throttleControls.style.marginBottom = '20px';
  leftControls.appendChild(throttleControls);

  const throttleUp = document.createElement('button');
  throttleUp.textContent = '↑ Throttle';
  throttleUp.style.display = 'block';
  throttleUp.style.marginBottom = '10px';
  throttleUp.style.padding = '15px';
  throttleUp.style.backgroundColor = 'rgba(0, 100, 0, 0.6)';
  throttleUp.style.color = 'white';
  throttleUp.style.border = 'none';
  throttleUp.style.borderRadius = '5px';
  throttleControls.appendChild(throttleUp);

  const throttleDown = document.createElement('button');
  throttleDown.textContent = '↓ Throttle';
  throttleDown.style.display = 'block';
  throttleDown.style.padding = '15px';
  throttleDown.style.backgroundColor = 'rgba(100, 0, 0, 0.6)';
  throttleDown.style.color = 'white';
  throttleDown.style.border = 'none';
  throttleDown.style.borderRadius = '5px';
  throttleControls.appendChild(throttleDown);

  // Fire button
  const fireButton = document.createElement('button');
  fireButton.textContent = '🔥 Fire';
  fireButton.style.padding = '20px';
  fireButton.style.backgroundColor = 'rgba(200, 0, 0, 0.6)';
  fireButton.style.color = 'white';
  fireButton.style.border = 'none';
  fireButton.style.borderRadius = '5px';
  leftControls.appendChild(fireButton);

  // Right side controls (pitch and roll)
  const rightControls = document.createElement('div');
  rightControls.id = 'right-controls';
  rightControls.style.width = '120px';
  rightControls.style.height = '120px';
  rightControls.style.borderRadius = '60px';
  rightControls.style.backgroundColor = 'rgba(50, 50, 50, 0.6)';
  rightControls.style.marginRight = '20px';
  rightControls.style.position = 'relative';
  rightControls.style.pointerEvents = 'auto';
  controlsContainer.appendChild(rightControls);

  // Touch events for controls
  throttleUp.addEventListener('touchstart', () => { touchState.throttleUp = true; });
  throttleUp.addEventListener('touchend', () => { touchState.throttleUp = false; });

  throttleDown.addEventListener('touchstart', () => { touchState.throttleDown = true; });
  throttleDown.addEventListener('touchend', () => { touchState.throttleDown = false; });

  fireButton.addEventListener('touchstart', () => { touchState.fire = true; });
  fireButton.addEventListener('touchend', () => { touchState.fire = false; });
}

function setupTouchListeners() {
  const rightControls = document.getElementById('right-controls');
  if (!rightControls) return;

  // Joystick for pitch and roll
  rightControls.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = rightControls.getBoundingClientRect();
    touchState.touchStartX = touch.clientX - rect.left - rect.width / 2;
    touchState.touchStartY = touch.clientY - rect.top - rect.height / 2;
    e.preventDefault();
  });

  rightControls.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect = rightControls.getBoundingClientRect();
    const touchX = touch.clientX - rect.left - rect.width / 2;
    const touchY = touch.clientY - rect.top - rect.height / 2;

    // Calculate direction based on touch position relative to center
    // Pitch control (up/down)
    if (touchY < -10) {
      touchState.pitchUp = true;
      touchState.pitchDown = false;
    } else if (touchY > 10) {
      touchState.pitchDown = true;
      touchState.pitchUp = false;
    } else {
      touchState.pitchUp = false;
      touchState.pitchDown = false;
    }

    // Roll control (left/right)
    if (touchX < -10) {
      touchState.rollLeft = true;
      touchState.rollRight = false;
    } else if (touchX > 10) {
      touchState.rollRight = true;
      touchState.rollLeft = false;
    } else {
      touchState.rollLeft = false;
      touchState.rollRight = false;
    }

    e.preventDefault();
  });

  rightControls.addEventListener('touchend', () => {
    // Reset all touch controls
    touchState.pitchUp = false;
    touchState.pitchDown = false;
    touchState.rollLeft = false;
    touchState.rollRight = false;
  });
}

/** Handle user input */
function handleInput(aircraft: Aircraft, scene: THREE.Scene) {
  // Throttle control (W/S and touch controls)
  if (keyState["KeyW"] || touchState.throttleUp) {
    aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  }
  if (keyState["KeyS"] || touchState.throttleDown) {
    aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);
  }

  // INVERTED PITCH CONTROL AS REQUESTED:
  // Down Arrow = Nose Up (negative pitch)
  // Up Arrow = Nose Down (positive pitch)

  if (keyState["ArrowUp"] || touchState.pitchDown) {
    // Nose DOWN (positive pitch in aircraft coordinates)
    aircraftState.pitch = Math.min(Math.PI / 3, aircraftState.pitch + aircraftState.rotationSpeed);
  }

  if (keyState["ArrowDown"] || touchState.pitchUp) {
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
  if (!keyState["ArrowUp"] && !keyState["ArrowDown"] && !touchState.pitchUp && !touchState.pitchDown) {
    aircraftState.pitch *= 0.98; // Slowly return to zero
  }

  // Roll Control (Arrow Left/Right and touch controls)
  if (!aircraftState.isOnGround) {
    if (keyState["ArrowLeft"] || touchState.rollLeft) {
      aircraftState.roll = Math.max(-Math.PI / 2, aircraftState.roll - aircraftState.rotationSpeed);
      aircraftState.yaw += aircraftState.rotationSpeed * 0.5; // Add yaw when rolling
    }
    if (keyState["ArrowRight"] || touchState.rollRight) {
      aircraftState.roll = Math.min(Math.PI / 2, aircraftState.roll + aircraftState.rotationSpeed);
      aircraftState.yaw -= aircraftState.rotationSpeed * 0.5; // Add yaw when rolling
    }
  }

  // If no roll input, gradually reset roll to neutral
  if (!keyState["ArrowLeft"] && !keyState["ArrowRight"] && !touchState.rollLeft && !touchState.rollRight) {
    aircraftState.roll *= 0.95; // Slowly return to zero
  }

  // Shoot bullets (Space or touch fire button)
  if (keyState["Space"] || touchState.fire) {
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
      const networkManager = gameState.getNetworkManager();
      if (networkManager && networkManager.getIsConnected()) {
        networkManager.sendShoot(bulletPosition, bulletDirection);
      }
    }
    // Add recoil to the aircraft
    aircraftState.pitch += aircraftState.rotationSpeed * 0.2; // Changed to match inverted controls
  }

  // Yaw Control (A/D and touch yaw) - Turn left/right
  if (aircraftState.isOnGround) {
    if (keyState["ArrowLeft"] || keyState["KeyA"] || touchState.yawLeft) aircraftState.yaw += aircraftState.rotationSpeed; // Direct turn on ground
    if (keyState["ArrowRight"] || keyState["KeyD"] || touchState.yawRight) aircraftState.yaw -= aircraftState.rotationSpeed;
  }
}

/** Update aircraft movement */
export function handleAircraftControls(aircraft: Aircraft, scene: THREE.Scene) {
  // Initialize mobile controls if needed
  if (isMobile && !document.getElementById('mobile-controls')) {
    initMobileControls();
  }

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
