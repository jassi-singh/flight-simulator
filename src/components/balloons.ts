import * as THREE from 'three';

export interface BalloonManager {
  group: THREE.Group;
  update: (deltaTime: number) => void;
  checkCollisions: (bulletPosition: THREE.Vector3, bulletRadius: number) => boolean;
  getScore: () => { popped: number, total: number };
  reset: () => void;
}

export function createBalloons(count: number = 500): BalloonManager {
  const group = new THREE.Group();

  // Balloon properties
  const balloonRadius = 5;
  const balloonSegments = 16;

  // Track balloon states
  const balloonStates: { active: boolean, position: THREE.Vector3, velocity: THREE.Vector3 }[] = [];
  let poppedCount = 0;

  // Create balloon geometry
  const balloonGeometry = new THREE.SphereGeometry(balloonRadius, balloonSegments, balloonSegments);

  // Create balloon colors
  const balloonColors = [
    0xFF0000, // Red
    0x00FF00, // Green
    0x0000FF, // Blue
    0xFFFF00, // Yellow
    0xFF00FF, // Magenta
    0x00FFFF, // Cyan
    0xFFA500, // Orange
  ];

  // Create instanced meshes for each color
  const balloonsPerColor = Math.ceil(count / balloonColors.length);
  const balloonMeshes: THREE.InstancedMesh[] = [];

  balloonColors.forEach(color => {
    const material = new THREE.MeshPhongMaterial({
      color,
      specular: 0x444444,
      shininess: 60,
      emissive: new THREE.Color(color).multiplyScalar(0.2)
    });

    const instancedMesh = new THREE.InstancedMesh(
      balloonGeometry,
      material,
      balloonsPerColor
    );

    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = false;
    instancedMesh.frustumCulled = true;

    balloonMeshes.push(instancedMesh);
    group.add(instancedMesh);
  });

  // Initialize balloon positions and states
  const dummy = new THREE.Object3D();
  let balloonIndex = 0;

  // Distribution parameters
  const areaSize = 2000; // Area size in the XZ plane
  const minHeight = 100;
  const maxHeight = 400;

  // Reset all matrices first
  balloonMeshes.forEach(mesh => {
    for (let i = 0; i < mesh.count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(0, 0, 0); // Zero scale to make invisible by default
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  // Place balloons
  for (let i = 0; i < count; i++) {
    // Random position within distribution area
    const x = (Math.random() - 0.5) * areaSize;
    const y = minHeight + Math.random() * (maxHeight - minHeight);
    const z = (Math.random() - 0.5) * areaSize;

    // Random slight movement
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, // Slight X movement
      Math.random() * 0.2,         // Slight upward movement
      (Math.random() - 0.5) * 0.5  // Slight Z movement
    );

    // Store balloon state
    balloonStates.push({
      active: true,
      position: new THREE.Vector3(x, y, z),
      velocity
    });

    // Determine which mesh to use based on color
    const colorIndex = i % balloonColors.length;
    const mesh = balloonMeshes[colorIndex];

    // Calculate index within specific color mesh
    const indexInMesh = Math.floor(i / balloonColors.length);

    if (indexInMesh < mesh.count) {
      // Set initial position and scale
      dummy.position.copy(balloonStates[i].position);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(indexInMesh, dummy.matrix);
    }

    balloonIndex++;
  }

  // Update matrices
  balloonMeshes.forEach(mesh => {
    mesh.instanceMatrix.needsUpdate = true;
  });

  // Update function to animate balloons
  const update = (deltaTime: number) => {
    let needsUpdate = false;

    balloonStates.forEach((state, index) => {
      if (!state.active) return; // Skip popped balloons

      // Move balloon slightly based on velocity
      state.position.add(state.velocity.clone().multiplyScalar(deltaTime));

      // Oscillate up and down slightly
      state.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;

      // Keep within bounds
      if (state.position.y > maxHeight) {
        state.velocity.y = -Math.abs(state.velocity.y);
      } else if (state.position.y < minHeight) {
        state.velocity.y = Math.abs(state.velocity.y);
      }

      // Update instance matrix
      const colorIndex = index % balloonColors.length;
      const mesh = balloonMeshes[colorIndex];
      const indexInMesh = Math.floor(index / balloonColors.length);

      if (indexInMesh < mesh.count) {
        dummy.position.copy(state.position);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(indexInMesh, dummy.matrix);
        needsUpdate = true;
      }
    });

    // Only update matrices if needed
    if (needsUpdate) {
      balloonMeshes.forEach(mesh => {
        mesh.instanceMatrix.needsUpdate = true;
      });
    }
  };

  // Check collisions with bullets
  const checkCollisions = (bulletPosition: THREE.Vector3, bulletRadius: number): boolean => {
    let hitDetected = false;

    // Check each active balloon
    balloonStates.forEach((state, index) => {
      if (!state.active) return;

      // Simple distance-based collision detection
      const distance = bulletPosition.distanceTo(state.position);
      const collisionThreshold = balloonRadius + bulletRadius;

      if (distance < collisionThreshold) {
        // Mark as popped
        state.active = false;
        poppedCount++;
        hitDetected = true;

        // Hide the popped balloon
        const colorIndex = index % balloonColors.length;
        const mesh = balloonMeshes[colorIndex];
        const indexInMesh = Math.floor(index / balloonColors.length);

        if (indexInMesh < mesh.count) {
          dummy.scale.set(0, 0, 0); // Scale to zero to hide
          dummy.updateMatrix();
          mesh.setMatrixAt(indexInMesh, dummy.matrix);
          mesh.instanceMatrix.needsUpdate = true;
        }
      }
    });

    return hitDetected;
  };

  // Get current score
  const getScore = () => {
    return {
      popped: poppedCount,
      total: count
    };
  };

  // Reset all balloons
  const reset = () => {
    balloonIndex = 0;
    poppedCount = 0;

    // Reset states
    balloonStates.forEach((state) => {
      state.active = true;

      // New random position
      state.position.set(
        (Math.random() - 0.5) * areaSize,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * areaSize
      );
    });

    // Update matrices
    balloonStates.forEach((state, index) => {
      const colorIndex = index % balloonColors.length;
      const mesh = balloonMeshes[colorIndex];
      const indexInMesh = Math.floor(index / balloonColors.length);

      if (indexInMesh < mesh.count) {
        dummy.position.copy(state.position);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(indexInMesh, dummy.matrix);
      }
    });

    // Update all instance matrices
    balloonMeshes.forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
    });
  };

  return {
    group,
    update,
    checkCollisions,
    getScore,
    reset
  };
}
