import aircraft from './aircraft';
import { camera, updateCamera } from './camera';
import { handleCameraControls } from './controls';
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

scene.add(aircraft)

function animate() {
  aircraft.propeller.rotation.z += 0.1;
  updateCamera()
  handleCameraControls(camera, aircraft);

  renderer.render(scene, camera);

}
