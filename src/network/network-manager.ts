import * as THREE from 'three';
import { EventEmitter } from '../utils/event-emitter';
import { Aircraft } from '../utils/types';
import { createAircraft } from '../components/aircraft';

// Remote player representation
export interface RemotePlayer {
	id: string;
	model: Aircraft;
	position: THREE.Vector3;
	rotation: THREE.Quaternion;
	speed: number;
	lastUpdate: number;
}

// Remote bullet representation
export interface RemoteBullet {
	id: string;
	playerId: string;
	position: THREE.Vector3;
	direction: THREE.Vector3;
	speed: number;
	createdAt: number;
}

export class NetworkManager extends EventEmitter {
	private socket: WebSocket | null = null;
	private playerId: string | null = null;
	private remotePlayers: Map<string, RemotePlayer> = new Map();
	private remoteBullets: Map<string, RemoteBullet> = new Map();
	private isConnected: boolean = false;
	private reconnectTimeout: number | null = null;
	private serverUrl: string;

	private scene: THREE.Scene | null = null;

	constructor(serverUrl: string = 'ws://localhost:8080/ws') {
		super();
		this.serverUrl = serverUrl;
	}

	/**
	 * Initialize the network manager with scene
	 */
	init(scene: THREE.Scene): void {
		this.scene = scene;
	}

	/**
	 * Connect to the WebSocket server
	 */
	connect(): void {
		if (this.socket) {
			this.socket.close();
		}

		this.socket = new WebSocket(this.serverUrl);

		this.socket.onopen = this.handleOpen.bind(this);
		this.socket.onmessage = this.handleMessage.bind(this);
		this.socket.onclose = this.handleClose.bind(this);
		this.socket.onerror = this.handleError.bind(this);

		console.log(`[NetworkManager] Connecting to ${this.serverUrl}...`);
	}

	/**
	 * Reconnect to the server after a delay
	 */
	private reconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		this.reconnectTimeout = window.setTimeout(() => {
			console.log('[NetworkManager] Attempting to reconnect...');
			this.connect();
		}, 2000);
	}

	/**
	 * Handle WebSocket open event
	 */
	private handleOpen(event: Event): void {
		console.log('[NetworkManager] Connected to server');
		this.isConnected = true;
		this.emit('connected');
	}

	/**
	 * Handle WebSocket message event
	 */
	private handleMessage(event: MessageEvent): void {
		try {
			const message = JSON.parse(event.data);

			switch (message.type) {
				case 'welcome':
					this.playerId = message.payload.id;
					console.log(`[NetworkManager] Received player ID: ${this.playerId}`);
					this.emit('player_initialized', this.playerId);
					break;

				case 'state':
					this.handleStateUpdate(message.payload);
					break;

				case 'player_joined':
					console.log(`[NetworkManager] Player joined: ${message.payload.id}`);
					this.emit('player_joined', message.payload.id);
					break;

				case 'player_left':
					this.removeRemotePlayer(message.payload.id);
					this.emit('player_left', message.payload.id);
					break;

				case 'bullet_created':
					this.createRemoteBullet(message.payload);
					this.emit('bullet_created', message.payload);
					break;

				default:
					console.warn(`[NetworkManager] Unknown message type: ${message.type}`);
			}
		} catch (error) {
			console.error('[NetworkManager] Error parsing message:', error);
		}
	}

	/**
	 * Handle WebSocket close event
	 */
	private handleClose(event: CloseEvent): void {
		console.log(`[NetworkManager] Disconnected from server: ${event.code}`);
		this.isConnected = false;
		this.updateConnectionStatus('Disconnected from server. Reconnecting...', false);
		this.emit('disconnected', event.code);

		// Cleanup remote players and bullets
		this.cleanupRemotePlayers();
		this.cleanupRemoteBullets();

		// Try to reconnect
		this.reconnect();
	}

	/**
	 * Handle WebSocket error event
	 */
	private handleError(event: Event): void {
		console.error('[NetworkManager] WebSocket error:', event);
		this.emit('error', event);
	}

	/**
	 * Handle game state update from server
	 */
	private handleStateUpdate(state: any): void {
		if (!this.scene) return;

		// Update remote players
		if (state.players) {
			Object.entries(state.players).forEach(([id, data]: [string, any]) => {
				if (id !== this.playerId) {
					this.updateRemotePlayer(id, data);
				}
			});

			// Remove players that no longer exist in the state
			this.remotePlayers.forEach((player, id) => {
				if (!state.players[id]) {
					this.removeRemotePlayer(id);
				}
			});
		}

		// Update remote bullets
		if (state.bullets) {
			Object.entries(state.bullets).forEach(([id, data]: [string, any]) => {
				this.updateRemoteBullet(id, data);
			});

			// Remove bullets that no longer exist in the state
			this.remoteBullets.forEach((bullet, id) => {
				if (!state.bullets[id]) {
					this.removeRemoteBullet(id);
				}
			});
		}

		this.emit('state_updated', state);
	}

	/**
	 * Update or create a remote player
	 */
	private updateRemotePlayer(id: string, data: any): void {
		if (!this.scene) return;

		let player = this.remotePlayers.get(id);

		if (!player) {
			// Create new remote player by cloning aircraft
			const model = createAircraft() as Aircraft;
			this.scene.add(model);

			// Change color to distinguish from local player
			model.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					if (object.material instanceof THREE.MeshStandardMaterial) {
						// Clone the material to avoid affecting other aircraft
						object.material = object.material.clone();
						object.material.color.set(0xff0000); // Red color for remote players
					}
				}
			});

			player = {
				id,
				model,
				position: new THREE.Vector3(),
				rotation: new THREE.Quaternion(),
				speed: 0,
				lastUpdate: Date.now()
			};

			this.remotePlayers.set(id, player);
			console.log(`[NetworkManager] Created remote player: ${id}`);
		}

		// Update player data
		if (data.position) {
			player.position.set(
				data.position[0],
				data.position[1],
				data.position[2]
			);
			player.model.position.copy(player.position);
		}

		if (data.rotation) {
			player.rotation.set(
				data.rotation[0],
				data.rotation[1],
				data.rotation[2],
				data.rotation[3]
			);
			player.model.quaternion.copy(player.rotation);
		}

		if (data.speed !== undefined) {
			player.speed = data.speed;
		}

		player.lastUpdate = Date.now();
	}

	/**
	 * Remove a remote player
	 */
	private removeRemotePlayer(id: string): void {
		const player = this.remotePlayers.get(id);
		if (player && this.scene) {
			this.scene.remove(player.model);
			this.remotePlayers.delete(id);
			console.log(`[NetworkManager] Removed remote player: ${id}`);
		}
	}

	/**
	 * Clean up all remote players
	 */
	private cleanupRemotePlayers(): void {
		if (!this.scene) return;

		this.remotePlayers.forEach(player => {
			this.scene!.remove(player.model);
		});

		this.remotePlayers.clear();
	}

	/**
	 * Update or create a remote bullet
	 */
	private updateRemoteBullet(id: string, data: any): void {
		if (!this.scene) return;

		let bullet = this.remoteBullets.get(id);

		if (!bullet) {
			// Store bullet data
			bullet = {
				id,
				playerId: data.playerId,
				position: new THREE.Vector3(),
				direction: new THREE.Vector3(),
				speed: 0,
				createdAt: Date.now()
			};

			this.remoteBullets.set(id, bullet);

			// Use existing bullet system
			if (data.position && data.direction) {
				const position = new THREE.Vector3(
					data.position[0],
					data.position[1],
					data.position[2]
				);

				const direction = new THREE.Vector3(
					data.direction[0],
					data.direction[1],
					data.direction[2]
				);

				// Import fire bullet from your existing weapon system
				import('../systems/weapons').then(module => {
					module.fireBullet(this.scene!, position, direction);
				});
			}
		}
	}

	/**
	 * Create a remote bullet directly from server message
	 */
	private createRemoteBullet(data: any): void {
		if (data.playerId === this.playerId) return; // Skip our own bullets
		this.updateRemoteBullet(data.id, data);
	}

	/**
	 * Remove a remote bullet
	 */
	private removeRemoteBullet(id: string): void {
		// Just remove from tracking - the bullet lifecycle is handled by weapon system
		this.remoteBullets.delete(id);
	}

	/**
	 * Clean up all remote bullets
	 */
	private cleanupRemoteBullets(): void {
		this.remoteBullets.clear();
	}

	/**
	 * Send player position update to server
	 */
	sendPositionUpdate(position: THREE.Vector3, rotation: THREE.Quaternion, speed: number): void {
		if (!this.isConnected || !this.socket) return;

		this.socket.send(JSON.stringify({
			type: 'update',
			payload: {
				position: [position.x, position.y, position.z],
				rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
				speed
			}
		}));
	}

	/**
	 * Send shoot action to server
	 */
	sendShoot(position: THREE.Vector3, direction: THREE.Vector3): void {
		if (!this.isConnected || !this.socket) return;

		this.socket.send(JSON.stringify({
			type: 'shoot',
			payload: {
				position: [position.x, position.y, position.z],
				direction: [direction.x, direction.y, direction.z]
			}
		}));
	}

	/**
	 * Get player ID
	 */
	getPlayerId(): string | null {
		return this.playerId;
	}

	/**
	 * Check if connected to server
	 */
	getIsConnected(): boolean {
		return this.isConnected;
	}

	/**
	 * Get all remote players
	 */
	getRemotePlayers(): Map<string, RemotePlayer> {
		return this.remotePlayers;
	}

	/**
	 * Get all remote bullets
	 */
	getRemoteBullets(): Map<string, RemoteBullet> {
		return this.remoteBullets;
	}
}
