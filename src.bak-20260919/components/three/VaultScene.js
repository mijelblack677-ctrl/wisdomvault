import * as THREE from 'three';
import { setupLighting } from './lighting.js';
import { createVaultGroup } from './vaultGeometry.js';
import { createParticleSystem, createDustSystem } from './particles.js';

export function initVaultScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#87CEEB');
  scene.fog = new THREE.FogExp2('#C8E6F5', 0.00008);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  const lights = setupLighting(scene);
  const { blueLight } = lights;

  const vaultGroup = createVaultGroup();
  scene.add(vaultGroup);

  const particles = createParticleSystem();
  scene.add(particles);

  const dust = createDustSystem();
  scene.add(dust);

  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Use THREE.Timer instead of deprecated THREE.Clock
  const timer = new THREE.Timer();

  function animate(timestamp) {
    requestAnimationFrame(animate);

    timer.update(timestamp);
    const elapsedTime = timer.getElapsed();

    // Smooth mouse following
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // Animate vault group
    vaultGroup.children.forEach((child) => {
      if (child.name === 'vault') {
        child.rotation.y += 0.003;
        child.rotation.x += 0.001;
      }
      if (child.name === 'wireframe') {
        child.rotation.y += 0.004;
        child.rotation.x += 0.0015;
      }
      if (child.name === 'glowSphere') {
        const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.15;
        child.scale.setScalar(pulse);
        child.material.opacity = 0.08 + Math.sin(elapsedTime * 1.5) * 0.04;
      }
      if (child.name === 'ring') {
        child.rotation.z += 0.002;
      }
      if (child.name === 'ring2') {
        child.rotation.z -= 0.0015;
        child.rotation.x += 0.001;
      }
    });

    // Animate particles
    const pArr = particles.geometry.attributes.position.array;
    for (let i = 0; i < pArr.length / 3; i++) {
      pArr[i * 3 + 1] += 0.002;
      pArr[i * 3] += Math.sin(elapsedTime * 0.5 + i) * 0.001;
      if (pArr[i * 3 + 1] > 6) pArr[i * 3 + 1] = -5;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Animate dust
    const dArr = dust.geometry.attributes.position.array;
    for (let i = 0; i < dArr.length / 3; i++) {
      dArr[i * 3 + 1] += 0.001;
      dArr[i * 3] += Math.sin(elapsedTime * 0.7 + i * 0.5) * 0.002;
      if (dArr[i * 3 + 1] > 5) dArr[i * 3 + 1] = -4;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    // Camera parallax
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Pulse gold light
    blueLight.intensity = 20 + Math.sin(elapsedTime * 2) * 3;

    renderer.render(scene, camera);
  }

  // Start the animation loop
  requestAnimationFrame(animate);
}
