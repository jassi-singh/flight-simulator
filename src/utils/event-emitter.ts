export class EventEmitter {
	private events: { [event: string]: Function[] } = {};

	/**
	 * Subscribe to an event
	 */
	on(event: string, callback: Function): void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(callback);
	}

	/**
	 * Unsubscribe from an event
	 */
	off(event: string, callback: Function): void {
		if (!this.events[event]) return;

		this.events[event] = this.events[event].filter(cb => cb !== callback);

		if (this.events[event].length === 0) {
			delete this.events[event];
		}
	}

	/**
	 * Emit an event with data
	 */
	emit(event: string, ...args: any[]): void {
		if (!this.events[event]) return;

		this.events[event].forEach(callback => {
			try {
				callback(...args);
			} catch (error) {
				console.error(`Error in event ${event} callback:`, error);
			}
		});
	}

	/**
	 * Clear all event listeners
	 */
	clear(): void {
		this.events = {};
	}
}
