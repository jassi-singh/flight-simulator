// Detect device orientation and show/hide appropriate messages
export function setupOrientationHandling() {
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	if (!isMobile) return;

	const instructions = document.getElementById('mobile-instructions');

	function checkOrientation() {
		if (instructions) {
			if (window.innerHeight > window.innerWidth) {
				// Portrait orientation
				instructions.style.display = 'block';
			} else {
				// Landscape orientation
				instructions.style.display = 'none';
			}
		}
	}

	// Check on load
	checkOrientation();

	// Check on resize or orientation change
	window.addEventListener('resize', checkOrientation);
	window.addEventListener('orientationchange', checkOrientation);
}
