import { AircraftState } from '../utils/types';

/** Manages aircraft state */
class AircraftStateManager implements AircraftState {
  speed = 0;
  altitude = 0;
  yaw = 0;
  pitch = 0;
  roll = 0;
  throttle = 0;
  isOnGround = true;

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

// Singleton instance
const aircraftState = new AircraftStateManager();

// Export function to get current state
export function getCurrentAircraftState(): AircraftState {
  return aircraftState;
}

export { aircraftState };
