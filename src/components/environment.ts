import * as THREE from "three";

export function createEnvironment() {
  const groundSize = 10000; // Terrain dimensions
  const textureLoader = new THREE.TextureLoader();

  // Load grass texture for the ground
  const grassTexture = textureLoader.load("/textures/grass.jpg");
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(groundSize / 10, groundSize / 10); // Adjust tiling

  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 256, 256);
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    displacementScale: 10,
    wireframe: false
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to be flat
  ground.position.y = -1; // Lower the ground
  ground.receiveShadow = true;

  // Load skybox textures
  const skyboxLoader = new THREE.CubeTextureLoader();
  const sky = skyboxLoader.load([
    "/textures/sky/sky_right.png",
    "/textures/sky/sky_left.png",
    "/textures/sky/sky_top.png",
    "/textures/sky/sky_bottom.png",
    "/textures/sky/sky_front.png",
    "/textures/sky/sky_back.png",
  ]);

  // Load runway texture
  const runwayTexture = textureLoader.load("/textures/runway.png");
  runwayTexture.wrapT = THREE.RepeatWrapping;
  runwayTexture.repeat.set(1, 30); // Stretch along the runway length

  const runwayMaterial = new THREE.MeshStandardMaterial({
    map: runwayTexture,
    side: THREE.DoubleSide,
  });

  // Create runway geometry
  const runwayGeometry = new THREE.PlaneGeometry(10, 80);
  const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);

  // Position and rotate the runway
  runway.rotation.x = -Math.PI / 2; // Flat on the ground
  runway.position.set(0, -0.9, 10); // Slightly above the ground
  runway.receiveShadow = true;

  // Generate random trees and buildings
  const trees: THREE.Mesh[] = [];
  const buildings: THREE.Mesh[] = [];

  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * groundSize * 0.8;
    const z = (Math.random() - 0.5) * groundSize * 0.8;

    if (Math.random() > 0.5) {
      trees.push(...createTree(x, z));
    } else {
      buildings.push(createBuilding(x, z));
    }
  }

  return { ground, sky, runway, trees, buildings };
}

// Generate a tree at specified position
function createTree(x: number, z: number) {
  const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

  const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
  const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);

  trunk.position.set(x, 2.5, z);
  leaves.position.set(x, 6, z);

  return [trunk, leaves];
}

// Generate a building at specified position
function createBuilding(x: number, z: number) {
  const buildingGeometry = new THREE.BoxGeometry(
    Math.random() * 10 + 10, // Width
    Math.random() * 20 + 20, // Height
    Math.random() * 10 + 10  // Depth
  );
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

  building.position.set(x, building.geometry.parameters.height / 2, z);
  return building;
}
