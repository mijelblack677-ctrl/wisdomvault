import * as THREE from 'three';
export function createVaultGroup() {
  const group = new THREE.Group();
  const vGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const vMat = new THREE.MeshPhysicalMaterial({ color: '#7EC8E3', metalness: 0.1, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.4, emissive: '#4A9FC4', emissiveIntensity: 0.1, transparent: true, opacity: 0.92 });
  const vault = new THREE.Mesh(vGeo, vMat); vault.name = 'vault'; group.add(vault);
  const gGeo = new THREE.SphereGeometry(0.9, 32, 32);
  const gMat = new THREE.MeshBasicMaterial({ color: '#A8D8EA', transparent: true, opacity: 0.15 });
  const glow = new THREE.Mesh(gGeo, gMat); glow.name = 'glowSphere'; group.add(glow);
  const wGeo = new THREE.IcosahedronGeometry(1.65, 1);
  const wMat = new THREE.MeshBasicMaterial({ color: '#A8D8EA', wireframe: true, transparent: true, opacity: 0.1 });
  const wire = new THREE.Mesh(wGeo, wMat); wire.name = 'wireframe'; group.add(wire);
  const rGeo = new THREE.TorusGeometry(2.2, 0.015, 16, 100);
  const rMat = new THREE.MeshStandardMaterial({ color: '#87CEEB', metalness: 0.3, roughness: 0.3, emissive: '#87CEEB', emissiveIntensity: 0.15 });
  const ring = new THREE.Mesh(rGeo, rMat); ring.rotation.x = Math.PI / 2.8; ring.name = 'ring'; group.add(ring);
  const ring2 = new THREE.Mesh(rGeo, rMat.clone()); ring2.rotation.x = Math.PI / 2.2; ring2.rotation.y = Math.PI / 4; ring2.material.emissiveIntensity = 0.08; ring2.scale.set(1.08, 1.08, 1.08); ring2.name = 'ring2'; group.add(ring2);
  return group;
}
