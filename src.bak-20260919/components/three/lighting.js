import * as THREE from 'three';
export function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight('#B8D4E8', 0.8);
  scene.add(ambientLight);
  const blueLight = new THREE.PointLight('#87CEEB', 25, 20, 2);
  blueLight.position.set(0, 0, 0);
  scene.add(blueLight);
  const whiteLight = new THREE.PointLight('#FFFFFF', 12, 25, 2);
  whiteLight.position.set(3, 1, -3);
  scene.add(whiteLight);
  const rimLight = new THREE.PointLight('#E8F4FD', 8, 18, 2);
  rimLight.position.set(-3, -1, -3);
  scene.add(rimLight);
  return { ambientLight, blueLight, whiteLight, rimLight };
}
