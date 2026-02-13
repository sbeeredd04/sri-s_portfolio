import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RGBELoader } from 'three-stdlib';
import { createRoot } from 'react-dom/client';
import journeyData from '../../json/journey.json';

// Scene constants
const SCENE_SCALE = 5;
const STAR_DENSITY_PER_CHECKPOINT = 8000;
const STAR_FIELD_MAX_INITIAL_STARS = 6000;
const STAR_COLOR_MIN_INTENSITY = 0.7;
const STAR_COLOR_MAX_INTENSITY = 1.0;
const ROAD_POINTS_PER_CHECKPOINT = 200;
const ROAD_CURVE_LENGTH_MULTIPLIER = 2;
const ROAD_X_AMPLITUDE_1 = 150;
const ROAD_X_FREQUENCY_1 = 0.3;
const ROAD_X_AMPLITUDE_2 = 50;
const ROAD_X_FREQUENCY_2 = 0.15;
const ROAD_Y_AMPLITUDE_1 = 40;
const ROAD_Y_FREQUENCY_1 = 0.4;
const ROAD_Y_AMPLITUDE_2 = 20;
const ROAD_Y_FREQUENCY_2 = 0.8;
const ROAD_Z_SPACING = 6.0;
const OBJECT_PLACEMENT_OFFSET_T = 0.08;
const LATERAL_OFFSET_DISTANCE_CARD = 200;
const LATERAL_OFFSET_DISTANCE_HEADER = 150;

/**
 * ThreeJSResourceManager
 * 
 * Handles ALL heavy 3D setup operations during loading phase
 * ~1000+ LOC extracted from Loader.jsx
 */
export class ThreeJSResourceManager {
  constructor() {
    this.manager = new THREE.LoadingManager();
    
    this.scene = null;
    this.cssScene = null;
    this.camera = null;
    this.renderer = null;
    this.cssRenderer = null;
    
    this.roadCurve = null;
    this.frenetFrames = null;
    this.checkpoints = [];
    
    this.starfieldMesh = null;
    this.roadGeometry = null;
    this.roadMaterial = null;
    this.roadLine = null;
    
    this.pmremGenerator = null;
    this.environmentMap = null;
    
    this.isCompiled = false;
    this.journeyLength = journeyData.length;
    
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onResourcesReady = null;
  }

  setCallbacks(onProgress, onComplete, onError, onResourcesReady) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.onResourcesReady = onResourcesReady;
    
    this.totalPhases = 8;
    this.currentPhase = 0;
    this.phaseProgress = 0;
    this.overallProgress = 0;
  }

  updateProgress(phaseProgress = 1.0) {
    this.phaseProgress = Math.min(phaseProgress, 1.0);
    const completedPhases = this.currentPhase;
    const currentPhaseContribution = this.phaseProgress;
    const rawProgress = (completedPhases + currentPhaseContribution) / this.totalPhases;
    
    this.overallProgress = Math.min(rawProgress * 95, 95);
    
    if (this.onProgress) {
      this.onProgress(this.overallProgress);
    }
  }

  completePhase() {
    this.currentPhase++;
    this.phaseProgress = 0;
    this.updateProgress(1.0);
  }

  completeAllPhases() {
    this.overallProgress = 100;
    if (this.onProgress) {
      this.onProgress(100);
    }
  }

  async initializeResources(container) {
    try {
      this.updateProgress(0);
      await this.createRenderers(container);
      this.completePhase();
      
      await this.createScene();
      this.completePhase();
      
      await this.createCamera();
      this.completePhase();
      
      await this.createEnvironment();
      this.completePhase();
      
      await this.createStarfieldInstancedMesh();
      this.completePhase();
      
      await this.createRoadGeometry();
      this.completePhase();
      
      await this.createCheckpointObjects();
      this.completePhase();
      
      await this.compileShaders();
      this.completePhase();
      
      const resources = {
        scene: this.scene,
        cssScene: this.cssScene,
        camera: this.camera,
        renderer: this.renderer,
        cssRenderer: this.cssRenderer,
        roadCurve: this.roadCurve,
        frenetFrames: this.frenetFrames,
        checkpoints: this.checkpoints,
        resourceManager: this
      };
      
      this.completeAllPhases();
      
      if (this.onResourcesReady) {
        this.onResourcesReady(resources);
      }
      
      if (this.onComplete) {
        this.onComplete();
      }
      
      return resources;
    } catch (error) {
      console.error('Resource initialization failed:', error);
      
      const partialResources = {
        scene: this.scene || new THREE.Scene(),
        cssScene: this.cssScene || new THREE.Scene(),
        camera: this.camera || new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
        renderer: this.renderer,
        cssRenderer: this.cssRenderer,
        roadCurve: this.roadCurve,
        frenetFrames: this.frenetFrames,
        checkpoints: this.checkpoints || [],
        resourceManager: this,
        isPartial: true
      };
      
      if (this.onResourcesReady) {
        this.onResourcesReady(partialResources);
      }
      
      if (this.onError) {
        this.onError(error.message);
      }
      
      throw error;
    }
  }

  async createRenderers(container) {
    return new Promise((resolve, reject) => {
      try {
        this.renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false
        });
        
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.zIndex = '1';
        
        this.renderer.shadowMap.enabled = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        try {
          this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          this.pmremGenerator.compileEquirectangularShader();
        } catch (error) {
          console.warn('PMREMGenerator initialization failed:', error);
          this.pmremGenerator = null;
        }
        
        const canvas = this.renderer.domElement;
        canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          console.warn('WebGL context lost. Attempting to restore...');
          
          if (this.onError) {
            this.onError('WebGL context lost. Please refresh the page.');
          }
          
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = window.innerWidth;
          fallbackCanvas.height = window.innerHeight;
          fallbackCanvas.style.position = 'absolute';
          fallbackCanvas.style.top = '0';
          fallbackCanvas.style.left = '0';
          fallbackCanvas.style.zIndex = '9999';
          
          const ctx = fallbackCanvas.getContext('2d', { willReadFrequently: false });
          if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('WebGL context lost. Please refresh the page.', fallbackCanvas.width / 2, fallbackCanvas.height / 2);
          }
          
          if (canvas.parentElement) {
            canvas.parentElement.appendChild(fallbackCanvas);
          }
        }, false);
        
        canvas.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored successfully');
          if (this.onError) {
            this.onError(null);
          }
        }, false);

        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.zIndex = '2';
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async createScene() {
    return new Promise((resolve) => {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      this.scene.fog = new THREE.Fog(0x000000, 200 * SCENE_SCALE, 1000 * SCENE_SCALE);
      
      this.cssScene = new THREE.Scene();
      
      resolve();
    });
  }

  async createCamera() {
    return new Promise((resolve) => {
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight, 
        0.1,
        3000 * SCENE_SCALE
      );
      
      resolve();
    });
  }

  async createEnvironment() {
    return new Promise((resolve) => {
      this.updateProgress(0.01);
      
      const createProceduralEnvironment = () => {
        this.updateProgress(0.8);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(1, '#16213e');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        this.scene.background = texture;
        this.scene.environment = texture;
        
        this.updateProgress(1.0);
        resolve();
      };

      const rgbeLoader = new RGBELoader();
      rgbeLoader.setPath('/hdr/');
      
      rgbeLoader.load(
        'space_environment.hdr',
        (hdrTexture) => {
          this.updateProgress(0.5);
          
          hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
          hdrTexture.colorSpace = THREE.SRGBColorSpace;
          
          this.scene.background = hdrTexture;
          
          this.updateProgress(0.8);
          
          try {
            if (this.pmremGenerator) {
              const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture;
              this.scene.environment = envMap;
              this.environmentMap = envMap;
            } else {
              console.warn('PMREMGenerator not available, using texture directly');
              this.scene.environment = hdrTexture;
              this.environmentMap = hdrTexture;
            }
            
            this.updateProgress(1.0);
            resolve();
          } catch (error) {
            console.warn('PMREM generation failed, using texture directly:', error);
            this.scene.environment = hdrTexture;
            this.environmentMap = hdrTexture;
            this.updateProgress(1.0);
            resolve();
          }
        },
        (progress) => {
          if (progress.total > 0) {
            const progressRatio = progress.loaded / progress.total;
            this.updateProgress(progressRatio * 0.5);
          }
        },
        (error) => {
          createProceduralEnvironment();
          resolve();
        }
      );
    });
  }

  async createStarfieldInstancedMesh() {
    return new Promise((resolve) => {
      this.updateProgress(0);
        
      const starCount = Math.max(STAR_FIELD_MAX_INITIAL_STARS * 0.7, this.journeyLength * STAR_DENSITY_PER_CHECKPOINT * 0.8);
      
      this.updateProgress(0.1);
      
      const starGeometry = new THREE.SphereGeometry(1, 6, 6);
      const starMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0.8,
        depthWrite: false
      });
      
      this.updateProgress(0.2);
      
      this.starfieldMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
      
      const dummy = new THREE.Object3D();
      
      this.updateProgress(0.3);
      
      for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const y = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const z = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        dummy.position.set(x, y, z);
        
        const scale = THREE.MathUtils.randFloat(0.5, 2.5) * SCENE_SCALE * 0.2;
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        this.starfieldMesh.setMatrixAt(i, dummy.matrix);
        
        const intensity = THREE.MathUtils.randFloat(STAR_COLOR_MIN_INTENSITY, STAR_COLOR_MAX_INTENSITY);
        this.starfieldMesh.setColorAt(i, new THREE.Color(intensity, intensity, intensity));
        
        if (i % 5000 === 0) {
          const starProgress = i / starCount;
          this.updateProgress(0.3 + starProgress * 0.6);
        }
      }
      
      this.updateProgress(0.9);
      
      this.starfieldMesh.instanceMatrix.needsUpdate = true;
      this.starfieldMesh.instanceColor.needsUpdate = true;
      
      this.scene.add(this.starfieldMesh);
      
      this.updateProgress(1.0);
      resolve();
    });
  }

  async createRoadGeometry() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      const roadPoints = Math.max(600, this.journeyLength * ROAD_POINTS_PER_CHECKPOINT * 0.5);
      const points = [];
      
      this.updateProgress(0.1);
      
      for (let i = 0; i <= roadPoints; i++) {
        const t = (i / roadPoints) * Math.PI * (this.journeyLength + ROAD_CURVE_LENGTH_MULTIPLIER);
        
        const x = Math.sin(t * ROAD_X_FREQUENCY_1) * ROAD_X_AMPLITUDE_1 + 
                 Math.cos(t * ROAD_X_FREQUENCY_2) * ROAD_X_AMPLITUDE_2;
        const y = Math.cos(t * ROAD_Y_FREQUENCY_1) * ROAD_Y_AMPLITUDE_1 + 
                 Math.sin(t * ROAD_Y_FREQUENCY_2) * ROAD_Y_AMPLITUDE_2;
        const z = i * ROAD_Z_SPACING - (roadPoints * 2);
        
        points.push(new THREE.Vector3(x, y, z).multiplyScalar(SCENE_SCALE));
        
        if (i % 100 === 0) {
          const pointProgress = i / roadPoints;
          this.updateProgress(0.1 + pointProgress * 0.4);
        }
      }
      
      this.updateProgress(0.5);
      
      this.roadCurve = new THREE.CatmullRomCurve3(points);
      this.updateProgress(0.7);
      
      this.frenetFrames = this.roadCurve.computeFrenetFrames(roadPoints + 500, false);
      this.updateProgress(0.8);

      this.roadMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
      const linePoints = this.roadCurve.getPoints(roadPoints + 500);
      this.roadGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      this.roadLine = new THREE.Line(this.roadGeometry, this.roadMaterial);
      
      this.updateProgress(0.9);
      
      this.scene.add(this.roadLine);
      
      this.updateProgress(1.0);
      resolve();
    });
  }

  async createCheckpointObjects() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      if (this.checkpoints.length > 0) {
        this.updateProgress(1.0);
        resolve();
        return;
      }
        
      this.updateProgress(0.1);
        
      journeyData.forEach((data, i) => {
        const stopT = (i + 1) / (this.journeyLength + 1);
        const objectT = stopT + OBJECT_PLACEMENT_OFFSET_T;
        
        const position = this.roadCurve.getPointAt(objectT);
        const frameIndex = Math.floor(objectT * (this.frenetFrames.binormals.length - 1));
        const binormal = this.frenetFrames.binormals[frameIndex];

        const side = i % 2 === 0 ? 1 : -1;
        
        const cardOffsetDistance = LATERAL_OFFSET_DISTANCE_CARD * SCENE_SCALE;
        const headerOffsetDistance = LATERAL_OFFSET_DISTANCE_HEADER * SCENE_SCALE;
        
        const cardOffset = binormal.clone().multiplyScalar(cardOffsetDistance * side);
        const headerOffset = binormal.clone().multiplyScalar(headerOffsetDistance * -side);

        const cardElement = document.createElement('div');
        cardElement.className = 'journey-card';
        
        const cardOffscreenX = side > 0 ? '150px' : '-150px';
        cardElement.style.setProperty('--offscreen-x', cardOffscreenX);
        
        cardElement.innerHTML = `
          <div class="journey-content">
            <div class="journey-image-container">
              <img src="${data.image}" alt="${data.title}" class="journey-image">
            </div>
            <div class="journey-text-content">
              <p class="journey-description">${data.content}</p>
            </div>
          </div>
        `;
        
        const headerElement = document.createElement('div');
        headerElement.className = 'journey-header-overlay';
        
        const headerOffscreenX = side > 0 ? '-150px' : '150px';
        headerElement.style.setProperty('--offscreen-x', headerOffscreenX);

        const cardObject = new CSS3DObject(cardElement);
        cardObject.position.copy(position).add(cardOffset);
        cardObject.scale.set(1.5, 1.5, 1);
        
        const headerObject = new CSS3DObject(headerElement);
        headerObject.position.copy(position).add(headerOffset);
        headerObject.scale.set(1.3, 1.3, 1);
        
        this.cssScene.add(cardObject);
        this.cssScene.add(headerObject);

        const root = createRoot(headerElement);

        this.checkpoints.push({ 
          stopT, 
          cardObject, 
          headerObject, 
          data, 
          triggered: false,
          root,
          index: i
        });
        
        const checkpointProgress = (i + 1) / journeyData.length;
        this.updateProgress(0.1 + checkpointProgress * 0.8);
      });
        
      this.updateProgress(1.0);
      resolve();
    });
  }

  async compileShaders() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      setTimeout(() => {
        this.updateProgress(0.3);
        this.renderer.compile(this.scene, this.camera);
        this.updateProgress(0.7);
        
        this.isCompiled = true;
        
        this.updateProgress(1.0);
        resolve();
      }, 100);
    });
  }

  disposeThreeJSResources() {
    try {
      if (this.renderer && this.renderer.getContext()) {
        const gl = this.renderer.getContext();
        if (gl.isContextLost && gl.isContextLost()) {
          return;
        }
      }
    
      if (this.starfieldMesh) {
        if (this.starfieldMesh.geometry) this.starfieldMesh.geometry.dispose();
        if (this.starfieldMesh.material) this.starfieldMesh.material.dispose();
      }
      
      if (this.roadGeometry) {
        this.roadGeometry.dispose();
      }
      
      if (this.roadMaterial) {
        this.roadMaterial.dispose();
      }
      
      if (this.pmremGenerator) {
        this.pmremGenerator.dispose();
      }
      
      if (this.environmentMap) {
        this.environmentMap.dispose();
      }
      
      if (this.renderer) {
        this.renderer.dispose();
      }
    } catch (error) {
      console.warn('Error during THREE.js resource disposal:', error);
    }
  }

  disposeReactRoots() {
    this.checkpoints.forEach((cp, index) => {
      if (cp.root) {
        setTimeout(() => {
          try {
            cp.root.unmount();
          } catch (error) {
            console.warn(`Error unmounting React root for checkpoint ${index}:`, error);
          }
        }, 1000);
      }
    });
  }

  dispose() {
    this.disposeThreeJSResources();
    this.disposeReactRoots();
  }
}
