import * as THREE from 'three';
function createParticleTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); gradient.addColorStop(0.3, 'rgba(200, 230, 245, 0.6)');
  gradient.addColorStop(0.7, 'rgba(180, 215, 235, 0.1)'); gradient.addColorStop(1, 'rgba(180, 215, 235, 0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}
export function createParticleSystem() {
  const count = 600; const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
    const radius = 2.5 + Math.random() * 5;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
    positions[i * 3 + 2] = Math.cos(phi) * radius;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ map: createParticleTexture(), color: '#FFFFFF', size: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
  return new THREE.Points(geometry, material);
}
export function createDustSystem() {
  const count = 200; const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ map: createParticleTexture(), color: '#E8F4FD', size: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 });
  return new THREE.Points(geometry, material);
}
