import * as THREE from "three";

const groundSize = 10000; // Terrain dimensions
const textureLoader = new THREE.TextureLoader();

// Load grass texture with proper wrapping
const grassTexture = textureLoader.load("/textures/grass.jpg");
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(groundSize / 10, groundSize / 10); // Adjust tiling

const geometry = new THREE.PlaneGeometry(groundSize, groundSize, 256, 256);
const material = new THREE.MeshStandardMaterial({
  map: grassTexture, // Apply the grass texture
  displacementScale: 10, // Adjust elevation height
  wireframe: false
});

const ground = new THREE.Mesh(geometry, material);
ground.rotation.x = -Math.PI / 2; // Rotate to be flat
ground.position.y = -1; // Lower the ground
ground.receiveShadow = true;

const skyboxLoader = new THREE.CubeTextureLoader();
const sky = skyboxLoader.load([
  "/textures/sky/sky_right.png",  // +X
  "/textures/sky/sky_left.png",   // -X
  "/textures/sky/sky_top.png",    // +Y
  "/textures/sky/sky_bottom.png", // -Y
  "/textures/sky/sky_front.png",  // +Z
  "/textures/sky/sky_back.png",   // -Z
]);


export { ground, sky };
