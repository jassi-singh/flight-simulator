import { setupRenderer } from './utils/renderer';
import { createMainCamera, createTrailingCamera, updateCameras } from './utils/camera';
import { createEnvironment } from './components/environment';
import { createAircraft } from './components/aircraft';
import { handleAircraftControls } from './systems/controls';
import { updateBullets } from './systems/weapons';
import { updateHud } from './components/hud';
import './style.css';
import * as THREE from 'three';

// Create scene and setup rendering
const scene = new THREE.Scene();
const { renderer, viewport } = setupRenderer();

// Setup lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);

// Create environment
const { ground, runway, sky, trees, buildings } = createEnvironment();
scene.add(ground);
scene.add(runway);
scene.background = sky;
trees.forEach(tree => scene.add(tree));
buildings.forEach(building => scene.add(building));

// Create aircraft
const aircraft = createAircraft();
scene.add(aircraft);

// Setup cameras
const mainCamera = createMainCamera(viewport.width / viewport.height);
const trailCamera = createTrailingCamera(viewport.width / viewport.height);

// Animation loop
function animate() {
	// Update game systems
	handleAircraftControls(aircraft, scene);
	updateBullets(scene);
	updateHud();
	updateCameras(mainCamera, trailCamera, aircraft);

	// Render main view
	renderer.setViewport(0, 0, viewport.width, viewport.height);
	renderer.setScissorTest(false);
	renderer.render(scene, mainCamera);

	// Render picture-in-picture view
	const miniWidth = viewport.width * 0.25;
	const miniHeight = viewport.height * 0.25;
	renderer.setViewport(
		viewport.width - miniWidth - 10,
		viewport.height - miniHeight - 10,
		miniWidth,
		miniHeight
	);
	renderer.setScissor(
		viewport.width - miniWidth - 10,
		viewport.height - miniHeight - 10,
		miniWidth,
		miniHeight
	);
	renderer.setScissorTest(true);
	renderer.render(scene, trailCamera);
}

// Start animation loop
renderer.setAnimationLoop(animate);

// Handle window resize
window.addEventListener('resize', () => {
	viewport.width = window.innerWidth;
	viewport.height = window.innerHeight;
	renderer.setSize(viewport.width, viewport.height);
	mainCamera.aspect = viewport.width / viewport.height;
	mainCamera.updateProjectionMatrix();
	trailCamera.aspect = viewport.width / viewport.height;
	trailCamera.updateProjectionMatrix();
});
