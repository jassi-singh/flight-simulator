import * as THREE from 'three';

// Aircraft interface definition
export interface Aircraft extends THREE.Group {
  // You can extend this with additional aircraft-specific properties as needed
}

// Aircraft state interface
export interface AircraftState {
  speed: number;
  altitude: number;
  yaw: number;
  pitch: number;
  roll: number;
  throttle: number;
  isOnGround: boolean;
  readonly maxSpeed: number;
  readonly rotationSpeed: number;
  readonly liftForce: number;
  readonly gravity: number;

  updateSpeed(): void;
  applyPhysics(): void;
}

// Bullet interface
export interface Bullet {
  mesh: THREE.Mesh;
  lifespan: number;
}

// Viewport interface
export interface Viewport {
  width: number;
  height: number;
}
