import * as THREE from "three";
import { Aircraft, Bullet } from "../utils/types";

const bullets: Bullet[] = []; // Store active bullets
const bulletSpeed = 5;
const bulletLifetime = 100; // Frames before bullet disappears

/** Shoot bullets */
export function shootBullet(aircraft: Aircraft, scene: THREE.Scene) {
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
