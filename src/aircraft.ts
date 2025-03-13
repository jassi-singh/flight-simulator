import * as THREE from 'three';
import { Aircraft } from './interface';

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

  tailGroup.position.setY(-0.1)
  return tailGroup;
}

// Function to create propeller
//function createPropeller() {
//  const propeller = new THREE.Group();
//
//  // Hub
//  const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
//  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
//  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
//  hub.rotation.x = Math.PI / 2; // Rotate to match Z-axis alignment
//  propeller.add(hub);
//
//  // Blades
//  const bladeGeometry = new THREE.BoxGeometry(2, 0.1, 0.02);
//  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
//
//  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
//  blade.rotation.x = Math.PI / 2;
//  propeller.add(blade);
//
//  propeller.position.set(0, 0, 2); // Move to nose
//
//  return propeller;
//}
//
// Main Aircraft Assembly
const aircraft = new THREE.Group() as Aircraft;

aircraft.add(createFuselage());
aircraft.add(createCockpit());
aircraft.add(createWing());
aircraft.add(createTail());

export default aircraft;

