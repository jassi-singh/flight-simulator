import * as THREE from "three";
import { Aircraft } from "./aircraft";
const keyState: Record<string, boolean> = {};

window.addEventListener("keydown", (event) => (keyState[event.code] = true));
window.addEventListener("keyup", (event) => (keyState[event.code] = false));

export function handleCameraControls(camera: THREE.Camera, aircraft: Aircraft) {
  const cameraSpeed = 0.2;
  const rotationSpeed = 0.05;

  if (keyState["KeyW"]) camera.position.z -= cameraSpeed;
  if (keyState["KeyS"]) camera.position.z += cameraSpeed;
  if (keyState["KeyA"]) camera.position.x -= cameraSpeed;
  if (keyState["KeyD"]) camera.position.x += cameraSpeed;

  if (keyState["ArrowUp"]) aircraft.rotation.x -= rotationSpeed;
  if (keyState["ArrowDown"]) aircraft.rotation.x += rotationSpeed;

  // Roll (Banking Left/Right)
  if (keyState["ArrowLeft"]) aircraft.rotation.z += rotationSpeed;
  if (keyState["ArrowRight"]) aircraft.rotation.z -= rotationSpeed;
}
