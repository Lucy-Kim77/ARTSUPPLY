(function () {
  const canvas = document.getElementById("webgl-bg");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    innerWidth / innerHeight,
    1,
    100
  );
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(innerWidth, innerHeight);

  const count = 500;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xff4fbf,
    size: 0.06,
    transparent: true,
    opacity: 0.8,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0008;
    points.rotation.x += 0.0004;
    renderer.render(scene, camera);
  }

  animate();
})();
