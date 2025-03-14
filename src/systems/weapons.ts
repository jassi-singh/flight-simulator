import * as THREE from 'three';
import { BalloonManager } from '../components/balloons';

// Track bullets
const bullets: Array<{
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
}> = [];

const bulletSpeed = 10;
const bulletLifetime = 100; // Frames a bullet lives for
const bulletRadius = 0.3

// Store balloon manager reference
let balloonManager: BalloonManager | null = null;

// Set balloon manager
export function setBalloonManager(manager: BalloonManager) {
  balloonManager = manager;
}

// Fire a bullet
export function fireBullet(scene: THREE.Scene, position: THREE.Vector3, direction: THREE.Vector3) {
  const bulletGeometry = new THREE.SphereGeometry(bulletRadius, 8, 8);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  // Position bullet slightly in front of aircraft
  bullet.position.copy(position);
  scene.add(bullet);

  // Calculate bullet velocity based on direction
  const bulletVelocity = direction.clone().normalize().multiplyScalar(bulletSpeed);

  // Add to bullets array
  bullets.push({
    mesh: bullet,
    velocity: bulletVelocity,
    lifetime: bulletLifetime
  });
}

// Update all bullets
export function updateBullets(scene: THREE.Scene) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    // Update position
    bullet.mesh.position.add(bullet.velocity);

    // Check collision with balloons
    if (balloonManager) {
      const hit = balloonManager.checkCollisions(
        bullet.mesh.position.clone(),
        bulletRadius
      );

      if (hit) {
        // Remove bullet on hit
        scene.remove(bullet.mesh);
        bullets.splice(i, 1);
        continue;
      }
    }

    // Decrease lifetime
    bullet.lifetime--;

    // Remove if expired
    if (bullet.lifetime <= 0) {
      scene.remove(bullet.mesh);
      bullets.splice(i, 1);
    }
  }
}
