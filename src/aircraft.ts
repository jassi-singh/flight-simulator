import * as THREE from 'three';

interface Aircraft extends THREE.Group {
  propeller: THREE.Group;
}

// Function to create fuselage
function createFuselage() {
  const geometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x5555ff });
  const fuselage = new THREE.Mesh(geometry, material);
  fuselage.rotation.z = Math.PI / 2; // Rotate to align with X-axis
  return fuselage;
}

// Function to create cockpit
function createCockpit(material: THREE.Material) {
  const geometry = new THREE.SphereGeometry(0.3, 16, 16);
  const cockpit = new THREE.Mesh(geometry, material);
  cockpit.position.set(1.6, 0, 0);
  return cockpit;
}

// Function to create wings
function createWing() {
  const geometry = new THREE.BoxGeometry(2, 0.1, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const wing = new THREE.Mesh(geometry, material);

  wing.position.set(0, 0, 0);
  return wing;
}

// Function to create tail assembly
function createTail() {
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const tailGroup = new THREE.Group();

  // Vertical Stabilizer
  const verticalStabilizer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.1), material);
  verticalStabilizer.position.set(-1.5, 0.5, 0);
  tailGroup.add(verticalStabilizer);

  // Horizontal Stabilizer
  const horizontalStabilizer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), material);
  horizontalStabilizer.position.set(-1.5, 0.3, 0);
  tailGroup.add(horizontalStabilizer);

  return tailGroup;
}

// Function to create propeller
function createPropeller() {
  const propeller = new THREE.Group();

  // Hub
  const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  hub.rotation.z = Math.PI / 2;
  propeller.add(hub);

  // Blades
  const bladegeometry = new THREE.BoxGeometry(1, 0.1, 0.02); // long and thin
  const bladematerial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const blade = new THREE.Mesh(bladegeometry, bladematerial);
  blade.rotation.z = Math.PI / 2; // rotate 90 degrees
  propeller.add(blade);

  propeller.position.set(2, 0, 0);

  return propeller;
}

// Main Aircraft Assembly
const aircraft = new THREE.Group() as Aircraft;
const fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x5555ff });

aircraft.add(createFuselage());
aircraft.add(createCockpit(fuselageMaterial));
aircraft.add(createWing());
aircraft.add(createTail());
const propeller = createPropeller();
aircraft.add(propeller);

aircraft.propeller = propeller;

export default aircraft;
