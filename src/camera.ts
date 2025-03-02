import * as THREE from 'three';
import aircraft from './aircraft';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, -5); // Position it behind and slightly above the aircraft
camera.lookAt(aircraft.position)

function updateCamera() {
  camera.position.copy(aircraft.position).add(new THREE.Vector3(0, 2, -5)); // Offset from aircraft
  camera.lookAt(aircraft.position);
}

export { camera, updateCamera };
