import { Aircraft } from "./interface";
import * as THREE from "three";

// Tracks the state of key presses
const keyState: Record<string, boolean> = {};
const bullets: { mesh: THREE.Mesh, lifespan: number }[] = []; // Store active bullets
const bulletSpeed = 5;
const bulletLifetime = 100; // Frames before bullet disappears

/** Shoot bullets */
function shootBullet(aircraft: Aircraft, scene: THREE.Scene) {
  const bulletGeometry = new THREE.SphereGeometry(0.3, 8, 8); // Small sphere bullet
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  bullet.position.copy(aircraft.position); // Start at aircraft position

  // Set initial velocity
  const direction = new THREE.Vector3();
  aircraft.getWorldDirection(direction);
  bullet.userData.velocity = direction.multiplyScalar(bulletSpeed);

  bullets.push({ mesh: bullet, lifespan: bulletLifetime });
  scene.add(bullet);
}

/** Update bullets movement */
export function updateBullets(scene: THREE.Scene) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.mesh.position.add(bullet.mesh.userData.velocity);

    bullet.lifespan--; // Reduce lifespan
    if (bullet.lifespan <= 0) {
      scene.remove(bullet.mesh);
      bullets.splice(i, 1);
    }
  }
}

// Listen for key presses
window.addEventListener("keydown", (event) => (keyState[event.code] = true));
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

/** Manages aircraft state */
class AircraftState {
  speed = 0;
  altitude = 0; // Start above ground
  yaw = 0;
  pitch = 0;
  roll = 0;
  throttle = 0;
  isOnGround = true; // Track if aircraft is on ground

  readonly maxSpeed = 2;
  readonly rotationSpeed = 0.02;
  readonly liftForce = 0.05; // More lift for stronger effect
  readonly gravity = 0.02; // Stronger gravity for realism

  /** Update aircraft speed based on throttle */
  updateSpeed() {
    this.speed = this.maxSpeed * this.throttle;
    this.isOnGround = this.altitude <= 0 && this.speed < 0.1;
  }

  /** Apply gravity and lift forces */
  applyPhysics() {
    if (this.isOnGround) {
      this.altitude = 0;
      return;
    }

    // Calculate lift based on pitch and speed
    const lift = Math.sin(-this.pitch) * this.speed * this.liftForce;

    // Update altitude with lift and apply gravity
    this.altitude += lift;
    if (this.speed < 0.1)
      this.altitude = Math.max(0, this.altitude - this.gravity); // Apply gravity

    // Prevent going below ground
    if (this.altitude <= 0) {
      this.altitude = 0;
      this.speed = Math.max(0, this.speed - 0.1); // Reduce speed on landing
    }
  }
}

const aircraftState = new AircraftState();

/** Handle user input */
function handleInput(aircraft: Aircraft, scene: THREE.Scene) {
  // Throttle control (W/S)
  if (keyState["KeyW"]) aircraftState.throttle = Math.min(1, aircraftState.throttle + 0.01);
  if (keyState["KeyS"]) aircraftState.throttle = Math.max(0, aircraftState.throttle - 0.01);

  // Pitch Control (Arrow Up/Down)
  if (keyState["ArrowUp"]) {
    const minPitch = aircraftState.isOnGround ? 0 : Math.PI / 2; aircraftState.pitch = Math.min(minPitch, aircraftState.pitch + aircraftState.rotationSpeed);
  }

  if (keyState["ArrowDown"]) aircraftState.pitch = Math.max(-Math.PI / 2, aircraftState.pitch - aircraftState.rotationSpeed);

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
    // add recoil to the aircraft by nosing down
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
  aircraftState.isOnGround = aircraftState.altitude <= 0;
}

export function updateHud() {
  document.getElementById("speed")!.innerText = aircraftState.speed.toFixed(2);
  document.getElementById("altitude")!.innerText = aircraftState.altitude.toFixed(2);
  document.getElementById("throttle")!.innerText = aircraftState.throttle.toFixed(2);
  document.getElementById("pitch")!.innerText = aircraftState.pitch.toFixed(2);
  document.getElementById("roll")!.innerText = aircraftState.roll.toFixed(2);
  document.getElementById("yaw")!.innerText = aircraftState.yaw.toFixed(2);
}

