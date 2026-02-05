import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class GyroARDemo {
  constructor() {
    this.container = document.getElementById('container');
    this.statusEl = document.getElementById('status');
    this.alphaEl = document.getElementById('alpha');
    this.betaEl = document.getElementById('beta');
    this.gammaEl = document.getElementById('gamma');
    this.requestBtn = document.getElementById('requestBtn');

    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.screenOrientation = 0;

    this.init();
    this.checkPermissions();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.addLights();
    this.createScene();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  createScene() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      metalness: 0.5,
      roughness: 0.5
    });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.set(-2, 0, 0);
    this.scene.add(this.cube);

    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      metalness: 0.7,
      roughness: 0.3
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphere.position.set(0, 0, 0);
    this.scene.add(this.sphere);

    const torusGeometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0000ff,
      metalness: 0.6,
      roughness: 0.4
    });
    this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
    this.torus.position.set(2, 0, 0);
    this.scene.add(this.torus);

    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    const loader = new THREE.TextureLoader();
    const textCanvas = document.createElement('canvas');
    const context = textCanvas.getContext('2d');
    textCanvas.width = 512;
    textCanvas.height = 128;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 512, 128);
    context.font = 'Bold 40px Arial';
    context.fillStyle = '#000000';
    context.textAlign = 'center';
    context.fillText('DeviceOrientation API', 256, 70);
    
    const textTexture = new THREE.CanvasTexture(textCanvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture });
    const textGeometry = new THREE.PlaneGeometry(4, 1);
    this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
    this.textMesh.position.set(0, 2, 0);
    this.scene.add(this.textMesh);
  }

  async checkPermissions() {
    if (typeof DeviceOrientationEvent === 'undefined') {
      this.statusEl.textContent = '设备不支持陀螺仪';
      this.statusEl.style.color = '#ff4444';
      this.animate();
      return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.requestBtn.style.display = 'block';
      this.requestBtn.addEventListener('click', async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            this.requestBtn.style.display = 'none';
            this.startGyro();
          } else {
            this.statusEl.textContent = '陀螺仪权限被拒绝';
            this.statusEl.style.color = '#ff4444';
          }
        } catch (error) {
          this.statusEl.textContent = '请求权限失败';
          this.statusEl.style.color = '#ff4444';
          console.error(error);
        }
      });
      this.statusEl.textContent = '等待用户授权';
      this.statusEl.style.color = '#ffaa00';
    } else {
      this.startGyro();
    }

    this.animate();
  }

  startGyro() {
    window.addEventListener('deviceorientation', (event) => {
      this.deviceOrientation.alpha = event.alpha || 0;
      this.deviceOrientation.beta = event.beta || 0;
      this.deviceOrientation.gamma = event.gamma || 0;
      
      this.alphaEl.textContent = this.deviceOrientation.alpha.toFixed(1);
      this.betaEl.textContent = this.deviceOrientation.beta.toFixed(1);
      this.gammaEl.textContent = this.deviceOrientation.gamma.toFixed(1);
    });

    window.addEventListener('orientationchange', () => {
      this.screenOrientation = window.orientation || 0;
    });

    this.statusEl.textContent = '陀螺仪已启用';
    this.statusEl.style.color = '#4CAF50';
  }

  updateCameraFromGyro() {
    const alpha = THREE.MathUtils.degToRad(this.deviceOrientation.alpha);
    const beta = THREE.MathUtils.degToRad(this.deviceOrientation.beta);
    const gamma = THREE.MathUtils.degToRad(this.deviceOrientation.gamma);

    const euler = new THREE.Euler(beta - Math.PI / 2, alpha, -gamma, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.sphere.rotation.y += 0.005;

    this.torus.rotation.x += 0.02;
    this.torus.rotation.y += 0.01;

    this.updateCameraFromGyro();

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

new GyroARDemo();
