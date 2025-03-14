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

  // Generate trees and buildings using instancedMesh for better performance
  const trees = createTreeInstances(groundSize);
  const buildings = createBuildingInstances(groundSize);

  return { ground, sky, runway, trees, buildings };
}

// Generate tree instances for better performance
function createTreeInstances(groundSize: number) {
  const treeCount = 2500; // Changed back to 2500 trees
  const trees = new THREE.Group();

  // Skip if no trees requested
  if (treeCount <= 0) {
    return trees;
  }

  // Create trunk geometry and material
  const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });

  // Create leaves geometry with different varieties
  const leafGeometries = [
    new THREE.ConeGeometry(3, 6, 8),
    new THREE.SphereGeometry(3, 8, 8),
    new THREE.DodecahedronGeometry(3)
  ];

  // Create different leaf colors for variety
  const leafColors = [0x228B22, 0x006400, 0x32CD32, 0x008000];

  // Create instanced mesh for trunks
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
  trunks.castShadow = true;
  trunks.receiveShadow = true;

  // Create multiple instanced meshes for different leaf types
  const leavesPerType = Math.ceil(treeCount / leafGeometries.length);
  const leavesInstances = [];

  for (let i = 0; i < leafGeometries.length; i++) {
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: leafColors[i % leafColors.length]
    });

    const leafInstance = new THREE.InstancedMesh(
      leafGeometries[i],
      leafMaterial,
      leavesPerType
    );

    leafInstance.castShadow = true;
    leafInstance.receiveShadow = true;
    leavesInstances.push(leafInstance);
  }

  // Reset all matrices first to ensure no default positions
  const dummy = new THREE.Object3D();
  for (let i = 0; i < treeCount; i++) {
    dummy.position.set(0, 0, 0);
    dummy.scale.set(0, 0, 0); // Zero scale to make invisible if not set
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
  }

  for (let leafType = 0; leafType < leavesInstances.length; leafType++) {
    for (let i = 0; i < leavesPerType; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      leavesInstances[leafType].setMatrixAt(i, dummy.matrix);
    }
  }

  // Finding valid positions for trees
  const safetyRadius = 40; // Safety radius around runway
  const usedPositions = new Set();

  // Place trees with explicit position checking
  let validTreesPlaced = 0;
  const maxAttempts = treeCount * 2; // Prevent infinite loops
  let attempts = 0;

  while (validTreesPlaced < treeCount && attempts < maxAttempts) {
    attempts++;

    // Generate random position
    const x = (Math.random() - 0.5) * groundSize * 0.8;
    const z = (Math.random() - 0.5) * groundSize * 0.8;

    // Skip if at origin or near runway
    if ((Math.abs(x) < 10 && Math.abs(z) < 10) ||
      (Math.abs(x) < safetyRadius && Math.abs(z - 10) < safetyRadius)) {
      continue;
    }

    // Check if position is already used
    const posKey = `${Math.round(x / 10)},${Math.round(z / 10)}`;
    if (usedPositions.has(posKey)) {
      continue;
    }
    usedPositions.add(posKey);

    // Random scale for variety
    const scale = 0.7 + Math.random() * 0.6;
    const trunkHeight = 5 * scale;

    // Set trunk position and scale
    dummy.position.set(x, trunkHeight / 2, z);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();

    trunks.setMatrixAt(validTreesPlaced, dummy.matrix);

    // Set leaves position based on trunk height
    dummy.position.set(x, trunkHeight + (3 * scale), z);
    dummy.updateMatrix();

    // Determine which leaf type to use for this tree
    const leafType = validTreesPlaced % leavesInstances.length;
    const indexInLeafType = Math.floor(validTreesPlaced / leavesInstances.length);

    if (indexInLeafType < leavesPerType) {
      leavesInstances[leafType].setMatrixAt(indexInLeafType, dummy.matrix);
    }

    validTreesPlaced++;
  }

  // Update instance matrices
  trunks.instanceMatrix.needsUpdate = true;
  leavesInstances.forEach(leaves => {
    leaves.instanceMatrix.needsUpdate = true;
  });

  // Add to scene only after valid placement
  trees.add(trunks);
  leavesInstances.forEach(leaves => {
    trees.add(leaves);
  });

  return trees;
}

// Generate building instances for better performance
function createBuildingInstances(groundSize: number) {
  const buildingCount = 2000;
  const buildings = new THREE.Group();

  // Skip if no buildings requested
  if (buildingCount <= 0) {
    return buildings;
  }

  // Create a single building type and material for simplicity
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x708090,
    roughness: 0.7,
    metalness: 0.1
  });

  // Create instanced mesh
  const buildingInstances = new THREE.InstancedMesh(
    buildingGeometry,
    buildingMaterial,
    buildingCount
  );

  buildingInstances.castShadow = true;
  buildingInstances.receiveShadow = true;

  // Reset all matrices first to ensure no default positions
  const dummy = new THREE.Object3D();
  for (let i = 0; i < buildingCount; i++) {
    dummy.position.set(0, 0, 0);
    dummy.scale.set(0, 0, 0); // Zero scale to make invisible if not set
    dummy.updateMatrix();
    buildingInstances.setMatrixAt(i, dummy.matrix);
  }

  // Place buildings with explicit position checking
  let validBuildingsPlaced = 0;
  const safetyRadius = 40; // Safety radius around runway
  const maxAttempts = buildingCount * 2; // Prevent infinite loops
  let attempts = 0;

  while (validBuildingsPlaced < buildingCount && attempts < maxAttempts) {
    attempts++;

    // Random position across the ground
    const x = (Math.random() - 0.5) * groundSize * 0.8;
    const z = (Math.random() - 0.5) * groundSize * 0.8;

    // Skip if at origin or near runway
    if ((Math.abs(x) < 10 && Math.abs(z) < 10) ||
      (Math.abs(x) < safetyRadius && Math.abs(z - 10) < safetyRadius)) {
      continue;
    }

    // Building dimensions
    const width = Math.random() * 10 + 10;
    const height = Math.random() * 20 + 20;
    const depth = Math.random() * 10 + 10;

    // Position building with its base on the ground (y=0)
    dummy.position.set(x, height / 2, z);
    dummy.scale.set(width, height, depth);
    dummy.updateMatrix();

    buildingInstances.setMatrixAt(validBuildingsPlaced, dummy.matrix);
    validBuildingsPlaced++;
  }

  // Update instance matrix only if buildings were placed
  if (validBuildingsPlaced > 0) {
    buildingInstances.instanceMatrix.needsUpdate = true;
    buildings.add(buildingInstances);
  }

  return buildings;
}
