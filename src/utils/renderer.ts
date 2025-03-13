import * as THREE from 'three';
import { Viewport } from './types';

export function setupRenderer() {
  // Create viewport dimensions object
  const viewport: Viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // Create renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(viewport.width, viewport.height);
  document.body.appendChild(renderer.domElement);

  return { renderer, viewport };
}
