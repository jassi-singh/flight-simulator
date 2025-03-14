import { AircraftState } from '../utils/types';

/** Manages aircraft state */
class AircraftStateManager implements AircraftState {
  // Basic flight parameters
  speed = 0;
  altitude = 0;
  yaw = 0;
  pitch = 0;
  roll = 0;
  throttle = 0;
  isOnGround = true;

  // Advanced flight characteristics
  readonly maxSpeed = 200;
  readonly stallAngle = Math.PI / 6; // 30 degrees
  readonly rotationSpeed = 0.02;
  readonly liftForce = 0.5;
  readonly gravity = 0.01;
  readonly dragCoefficient = 0.0001;

  // Stall properties
  isStalling = false;
  stallRecoveryTimer = 0;
  readonly stallRecoveryTime = 60; // frames

  // Additional state variables
  angleOfAttack = 0;
  airDensity = 1.0; // Sea level density

  updateSpeed() {
    this.airDensity = Math.max(0.2, 1.0 - (this.altitude / 10000) * 0.8);

    const takeoffThreshold = 0.3;

    if (this.isOnGround) {
      if (this.throttle > takeoffThreshold) {
        const groundAccel = (this.throttle - takeoffThreshold) * 0.5;
        this.speed += groundAccel;
      } else {
        this.speed = Math.max(0, this.speed - 0.2);
      }
    } else {
      const airAccel = this.throttle * 0.5;
      this.speed += airAccel;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }

    this.angleOfAttack = Math.abs(this.pitch);

    const inducedDrag = Math.pow(this.angleOfAttack, 2) * this.dragCoefficient;
    const parasiticDrag = Math.pow(this.speed, 2) * this.dragCoefficient;

    const totalDrag = (inducedDrag + parasiticDrag) * this.airDensity;
    this.speed = Math.max(0, this.speed - totalDrag);

    this.isOnGround = this.altitude <= 0;

    if (this.speed > 100) {
      this.isOnGround = false;
    }
  }

  applyPhysics() {
    // Skip physics if on ground, except allow for takeoff
    if (this.isOnGround) {
      // Check for takeoff conditions
      if (this.speed > 50 && this.pitch < -0.05) {
        this.altitude = 1;
        this.isOnGround = false;
      } else {
        this.altitude = 0;
        this.isStalling = false;
        this.stallRecoveryTimer = 0;
        return;
      }
    }

    // Apply lift or descent based on pitch
    if (this.pitch < 0) {
      // Nose up - generate lift
      const pitchMagnitude = Math.abs(this.pitch);
      const liftAmount = pitchMagnitude * this.speed * this.liftForce;
      this.altitude += liftAmount;
    } else if (this.pitch > 0) {
      // Nose down - descend faster based on pitch angle and speed
      const pitchMagnitude = this.pitch;
      const descentRate = pitchMagnitude * this.speed * this.liftForce * 0.5;
      this.altitude -= descentRate;
    }

    // Apply base gravity
    const gravityEffect = this.gravity;
    this.altitude = Math.max(0, this.altitude - gravityEffect);

    // Check for stall conditions
    if (this.angleOfAttack > this.stallAngle) {
      // Entering stall condition
      if (!this.isStalling) {
        this.isStalling = true;
        this.stallRecoveryTimer = this.stallRecoveryTime;
      }

      // Reduced lift during stall
      this.altitude -= this.gravity * 2;

      // Reduce control effectiveness during stall
      if (this.pitch < 0) {
        this.pitch += 0.005;
      }

      // Roll instability during stall
      if (Math.random() > 0.5) {
        this.roll += (Math.random() - 0.5) * 0.01;
      }
    }

    // FIXED: Check for stall recovery regardless of current angle
    // This allows aircraft to recover from stall when appropriate conditions are met
    if (this.isStalling) {
      // Recovery happens when angle of attack is reduced and maintained below recovery threshold
      if (this.angleOfAttack < this.stallAngle * 0.7) {
        this.stallRecoveryTimer--;
        if (this.stallRecoveryTimer <= 0) {
          this.isStalling = false; // Clear stall condition
          this.stallRecoveryTimer = 0;
        }
      } else {
        // Reset recovery timer if angle still too high
        this.stallRecoveryTimer = this.stallRecoveryTime;
      }
    }

    // Prevent going below ground
    if (this.altitude <= 0) {
      this.altitude = 0;
      this.isOnGround = true;
      this.isStalling = false;
    }
  }

  /** Get the current angle of attack in degrees (for display) */
  getAngleOfAttack(): number {
    return this.angleOfAttack * (180 / Math.PI);
  }

  /** Get stall warning status (for HUD) */
  getStallWarning(): boolean {
    // Fixed: Changed warning threshold to be more responsive
    return this.isStalling || this.angleOfAttack > this.stallAngle * 0.75;
  }
}

// Singleton instance
const aircraftState = new AircraftStateManager();

// Export function to get current state
export function getCurrentAircraftState(): AircraftState {
  return aircraftState;
}

export { aircraftState };
