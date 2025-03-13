import aircraft from './aircraft';
import { handleAircraftControls, updateBullets, updateHud } from './controls';
import { buildings, ground, runway, sky, trees } from './ground-sky';
import './style.css';
import * as THREE from 'three';

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 100); // Position the light
scene.add(directionalLight);

scene.add(ground);
scene.add(runway);
scene.background = sky;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(aircraft.position)

scene.add(aircraft)
trees.forEach(tree => scene.add(tree));
buildings.forEach(building => scene.add(building));

function updateCamera() {
  const offset = new THREE.Vector3(0, 2, -5); // Position behind and above
  offset.applyQuaternion(aircraft.quaternion); // Rotate with aircraft
  camera.position.copy(aircraft.position).add(offset);
  camera.lookAt(aircraft.position);
}

const trailCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

function updateTrailingCamera() {
  const offset = new THREE.Vector3(0, 1, 2); // Offset behind and slightly above
  offset.applyQuaternion(aircraft.quaternion); // Rotate offset based on aircraft orientation

  trailCamera.position.copy(aircraft.position).add(offset); // Position the camera
  trailCamera.lookAt(aircraft.position); // Keep camera focused on aircraft}
}

function animate() {
  updateCamera();
  updateTrailingCamera();
  handleAircraftControls(aircraft, scene);
  updateBullets(scene);
  updateHud();


  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);

  const miniWidth = window.innerWidth * 0.25;
  const miniHeight = window.innerHeight * 0.25;
  renderer.setViewport(window.innerWidth - miniWidth - 10, window.innerHeight - miniHeight - 10, miniWidth, miniHeight);
  renderer.setScissor(window.innerWidth - miniWidth - 10, window.innerHeight - miniHeight - 10, miniWidth, miniHeight);
  renderer.setScissorTest(true);
  renderer.render(scene, trailCamera);


}
