import * as THREE from "three";

const groundSize = 20; // 20x20 block terrain
const blockSize = 1;
const ground = new THREE.Group(); // Group to hold all blocks
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load("/textures/grass.jpg");

const blockMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });

for (let x = 0; x < groundSize; x++) {
  for (let z = 0; z < groundSize; z++) {
    const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const block = new THREE.Mesh(blockGeometry, blockMaterial);

    block.position.set(x - groundSize / 2, -blockSize / 2, z - groundSize / 2); // Center it
    ground.add(block);
  }
}

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
