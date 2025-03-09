import aircraft from './aircraft';
import { handleAircraftControls, updateHud } from './controls';
import { ground, sky } from './ground-sky';
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
directionalLight.position.set(5, 5, 5); // Position the light
scene.add(directionalLight);

scene.add(ground);
scene.background = sky;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(aircraft.position)

scene.add(aircraft)

function updateCamera() {
  const offset = new THREE.Vector3(0, 2, -5); // Position behind and above
  offset.applyQuaternion(aircraft.quaternion); // Rotate with aircraft
  camera.position.copy(aircraft.position).add(offset);
  camera.lookAt(aircraft.position);
}

function animate() {
  aircraft.propeller.rotation.z += 0.3;

  updateCamera();
  handleAircraftControls(aircraft);
  updateHud();

  renderer.render(scene, camera);

}
