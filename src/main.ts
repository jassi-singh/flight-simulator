import { setupRenderer } from './utils/renderer';
import { createMainCamera, createTrailingCamera, updateCameras } from './utils/camera';
import { createEnvironment } from './components/environment';
import { createAircraft } from './components/aircraft';
import { handleAircraftControls } from './systems/controls';
import { updateBullets, setBalloonManager } from './systems/weapons';
import { createHUD, updateHUD } from './components/hud';
import { createBalloons } from './components/balloons';
import { createScoreCard } from './components/scorecard';
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
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create environment
const { ground, sky, runway, trees, buildings } = createEnvironment();
scene.add(ground);
scene.add(runway);
scene.background = sky;
scene.add(trees);
scene.add(buildings);

// Create aircraft
const aircraft = createAircraft();
scene.add(aircraft);

// Create balloons
const balloons = createBalloons(500);
scene.add(balloons.group);

// Setup balloon manager in weapons system
setBalloonManager(balloons);

// Create score card
const scoreCard = createScoreCard();

// Setup cameras
const mainCamera = createMainCamera(viewport.width / viewport.height);
const trailCamera = createTrailingCamera(viewport.width / viewport.height);

// Initialize HUD
createHUD();

// Track time for animation
let lastTime = 0;

// Animation loop
function animate(time: number) {
	const deltaTime = (time - lastTime) * 0.001; // Convert to seconds
	lastTime = time;

	// Update game systems
	handleAircraftControls(aircraft, scene);
	updateBullets(scene);
	updateHUD();
	updateCameras(mainCamera, trailCamera, aircraft);

	// Update balloons
	balloons.update(deltaTime);

	// Update score card
	const score = balloons.getScore();
	scoreCard.updateScore(score.popped, score.total);

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

// Reset balloons with R key
window.addEventListener('keydown', (event) => {
	if (event.key === 'r' || event.key === 'R') {
		balloons.reset();

		// Show reset notification
		const notification = document.createElement('div');
		notification.textContent = 'Balloons Reset!';
		notification.style.position = 'absolute';
		notification.style.top = '50%';
		notification.style.left = '50%';
		notification.style.transform = 'translate(-50%, -50%)';
		notification.style.padding = '15px 30px';
		notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		notification.style.color = 'white';
		notification.style.borderRadius = '5px';
		notification.style.fontFamily = 'Arial, sans-serif';
		notification.style.fontSize = '24px';
		notification.style.fontWeight = 'bold';
		notification.style.zIndex = '1001';
		document.body.appendChild(notification);

		// Remove notification after 2 seconds
		setTimeout(() => {
			document.body.removeChild(notification);
		}, 2000);
	}
});
