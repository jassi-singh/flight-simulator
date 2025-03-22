import { NetworkManager } from '../network/network-manager';

class GameState {
	private static instance: GameState;

	private _networkManager: NetworkManager | null = null;

	private constructor() { }

	static getInstance(): GameState {
		if (!GameState.instance) {
			GameState.instance = new GameState();
		}
		return GameState.instance;
	}

	setNetworkManager(networkManager: NetworkManager): void {
		this._networkManager = networkManager;
	}

	getNetworkManager(): NetworkManager | null {
		return this._networkManager;
	}

	// Add other game state accessors as needed
}

export default GameState.getInstance();
