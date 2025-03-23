import { setupRenderer } from './utils/renderer';
import { createMainCamera, createTrailingCamera, updateCameras } from './utils/camera';
import { createEnvironment } from './components/environment';
import { createAircraft } from './components/aircraft';
import { handleAircraftControls } from './systems/controls';
import { updateBullets, setBalloonManager } from './systems/weapons';
import { createHUD, updateHUD } from './components/hud';
import { createBalloons } from './components/balloons';
import { createScoreCard } from './components/scorecard';
import { NetworkManager } from './network/network-manager';
import './style.css';
import * as THREE from 'three';
import GameState from './utils/game-state';

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

// Initialize NetworkManager for multiplayer
const networkManager = new NetworkManager();
GameState.setNetworkManager(networkManager);
networkManager.init(scene);
networkManager.connect();

// Setup network manager events
setupNetworkEvents(networkManager);

// Player state variables for network updates
let lastNetworkUpdateTime = 0;
const networkUpdateInterval = 50; // Send position updates every 50ms

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

	// Send network updates at specified interval
	if (time - lastNetworkUpdateTime > networkUpdateInterval) {
		sendNetworkUpdate();
		lastNetworkUpdateTime = time;
	}

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

/**
 * Send aircraft position and state updates to the server
 */
function sendNetworkUpdate() {
	if (!networkManager.getIsConnected()) return;

	// Send aircraft position and rotation to server
	networkManager.sendPositionUpdate(
		aircraft.position,
		aircraft.quaternion,
		getAircraftSpeed() // You'll need to implement this function or get the speed from your aircraft state
	);
}

/**
 * Get aircraft speed from your aircraft state management
 */
function getAircraftSpeed(): number {
	// This is a placeholder - replace with your actual aircraft speed access method
	// For example, if you store aircraft state in a global variable or in the aircraft object
	// Return that value here
	return 50; // Default placeholder speed
}

/**
 * Setup network event handlers
 */
function setupNetworkEvents(networkManager: NetworkManager) {
	// Listen for network events
	networkManager.on('connected', () => {
		console.log('Connected to game server');
		showNotification('Connected to multiplayer server');
	});

	networkManager.on('disconnected', (code: number) => {
		console.log(`Disconnected from game server: ${code}`);
		showNotification('Disconnected from server. Reconnecting...');
	});

	networkManager.on('player_initialized', (playerId: string) => {
		console.log(`Initialized as player: ${playerId}`);
		showNotification(`Connected as Player ${playerId}`);
	});

	networkManager.on('player_joined', (playerId: string) => {
		console.log(`Player joined: ${playerId}`);
		showNotification(`Player ${playerId} joined the game`);
	});

	networkManager.on('player_left', (playerId: string) => {
		console.log(`Player left: ${playerId}`);
		showNotification(`Player ${playerId} left the game`);
	});

}

/**
 * Show notification popup
 */
function showNotification(message: string, duration: number = 2000) {
	const notification = document.createElement('div');
	notification.textContent = message;
	notification.style.position = 'absolute';
	notification.style.bottom = '80px';
	notification.style.left = '50%';
	notification.style.transform = 'translateX(-50%)';
	notification.style.padding = '10px 20px';
	notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	notification.style.color = 'white';
	notification.style.borderRadius = '5px';
	notification.style.fontFamily = 'Arial, sans-serif';
	notification.style.fontSize = '16px';
	notification.style.zIndex = '1001';
	document.body.appendChild(notification);

	// Remove notification after specified duration
	setTimeout(() => {
		if (document.body.contains(notification)) {
			document.body.removeChild(notification);
		}
	}, duration);
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
