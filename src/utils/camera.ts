import * as THREE from 'three';
import { Aircraft } from './types';

export function createMainCamera(aspect: number) {
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  return camera;
}

export function createTrailingCamera(aspect: number) {
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  return camera;
}

export function updateCameras(
  mainCamera: THREE.PerspectiveCamera,
  trailCamera: THREE.PerspectiveCamera,
  aircraft: Aircraft
) {
  // Update main camera (follows behind aircraft)
  const mainOffset = new THREE.Vector3(0, 2, -5); // Position behind and above
  mainOffset.applyQuaternion(aircraft.quaternion); // Rotate with aircraft
  mainCamera.position.copy(aircraft.position).add(mainOffset);
  mainCamera.lookAt(aircraft.position);

  // Update trailing camera (chase view)
  const trailOffset = new THREE.Vector3(0, 1, 2); // Position behind and slightly above
  trailOffset.applyQuaternion(aircraft.quaternion); // Rotate offset based on aircraft orientation
  trailCamera.position.copy(aircraft.position).add(trailOffset);
  trailCamera.lookAt(aircraft.position);
}
