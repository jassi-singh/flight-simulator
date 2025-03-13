import * as THREE from 'three';
import { Aircraft } from '../utils/types';

const PLANE_COLOR = 0xffffff;

// Function to create fuselage
function createFuselage() {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 3);
  const material = new THREE.MeshStandardMaterial({ color: PLANE_COLOR });
  const fuselage = new THREE.Mesh(geometry, material);
  return fuselage;
}

// Function to create cockpit
function createCockpit() {
  const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: PLANE_COLOR });
  const cockpit = new THREE.Mesh(geometry, material);
  cockpit.position.set(0, 0, 1.6);
  return cockpit;
}

// Function to create wings
function createWing() {
  const geometry = new THREE.BoxGeometry(4, 0.05, 1); // Wingspan along X-axis
  const material = new THREE.MeshStandardMaterial({ color: PLANE_COLOR });
  const wing = new THREE.Mesh(geometry, material);
  wing.position.set(0, 0, 0.5);
  return wing;
}

// Function to create tail assembly
function createTail() {
  const material = new THREE.MeshStandardMaterial({ color: PLANE_COLOR });
  const tailGroup = new THREE.Group();

  // Vertical Stabilizer
  const verticalStabilizer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.5), material);
  verticalStabilizer.position.set(0, 0.5, -1.4);
  tailGroup.add(verticalStabilizer);

  // Horizontal Stabilizer
  const horizontalStabilizer = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.4), material);
  horizontalStabilizer.position.set(0, 0.3, -1.4);
  tailGroup.add(horizontalStabilizer);

  tailGroup.position.setY(-0.1);
  return tailGroup;
}

// Main Aircraft Assembly
export function createAircraft() {
  const aircraft = new THREE.Group() as Aircraft;

  aircraft.add(createFuselage());
  aircraft.add(createCockpit());
  aircraft.add(createWing());
  aircraft.add(createTail());

  return aircraft;
}
