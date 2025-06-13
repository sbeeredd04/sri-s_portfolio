import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import DecryptedText from './DecryptedText';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { createRoot } from 'react-dom/client';
import journeyData from '../../json/journey.json';

const Beams = dynamic(() => import('../background/Beams'), { ssr: false });

// ──────────────────────────────────────────────────────────────────────────────
// LOADING STATES - Real resource creation phases mapped to UI progress
// ──────────────────────────────────────────────────────────────────────────────
const loadingStates = [
  { text: 'Initializing 3D environment...', checkpoint: 5 },
  { text: 'Creating geometry buffers...', checkpoint: 20 },
  { text: 'Building starfield mesh...', checkpoint: 35 },
  { text: 'Generating journey path...', checkpoint: 50 },
  { text: 'Loading journey assets...', checkpoint: 70 },
  { text: 'Compiling shaders...', checkpoint: 85 },
  { text: 'Finalizing scene...', checkpoint: 95 },
];

// ──────────────────────────────────────────────────────────────────────────────
// SCENE CONSTANTS - Must match Journey3D constants exactly
// ──────────────────────────────────────────────────────────────────────────────
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
const OBJECT_PLACEMENT_OFFSET_T = 0.065;
const LATERAL_OFFSET_DISTANCE_CARD = 250;   // ↓ from 250 - bring cards closer to road
const LATERAL_OFFSET_DISTANCE_HEADER = 150; // ↓ from 250 - bring headers closer to road

// ──────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS - Loading interface elements
// ──────────────────────────────────────────────────────────────────────────────
const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}> 
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" /> 
  </svg>
);

const CheckFilled = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${className}`}> 
    <circle cx="12" cy="12" r="9" fill="currentColor" /> 
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────────
// LOADING PROGRESS DISPLAY - Shows real-time resource creation status
// ──────────────────────────────────────────────────────────────────────────────
function LoaderCore({ loadingStates, progress, currentText }) {
  // Find which loading state is currently active
  const currentIdx = loadingStates.findIndex((s, i) => progress < s.checkpoint && (i === 0 || progress >= loadingStates[i - 1].checkpoint));
  const scrollIdx = currentIdx === -1 ? loadingStates.length - 1 : currentIdx;
  const offset = Math.max(0, scrollIdx - 2);
  
  // Use external text if provided, otherwise use default loading states
  const displayStates = currentText ? [
    ...loadingStates.slice(0, -1),
    { text: currentText, checkpoint: 100 }
  ] : loadingStates;
  
  return (
    <div className="overflow-hidden h-[200px] w-full flex flex-col items-end pr-6 select-none">
      <motion.div
        animate={{ y: -offset * 40 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        className="flex flex-col gap-4 pb-8">
        {displayStates.map((loadingState, index) => {
          const isComplete = progress >= loadingState.checkpoint;
          const isCurrent =
            progress < loadingState.checkpoint &&
            (index === 0 || progress >= displayStates[index - 1].checkpoint);
          return (
            <motion.div
              key={index}
              className="flex items-center gap-3 min-h-[40px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}>
              <span>
                {isComplete ? (
                  <CheckFilled className="text-white" />
                ) : (
                  <CheckIcon className="text-white opacity-40" />
                )}
              </span>
              <DecryptedText
                text={loadingState.text}
                speed={60}
                maxIterations={16}
                sequential={true}
                revealDirection="start"
                className={`major-mono-display-regular text-sm md:text-base tracking-widest ${isComplete ? 'text-white' : isCurrent ? 'text-white/80' : 'text-white/50'}`}
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// THREE.JS RESOURCE MANAGER - Handles ALL heavy 3D setup operations
// ──────────────────────────────────────────────────────────────────────────────

/**
 * ThreeJSResourceManager
 * 
 * CORE CONCEPT: Move ALL expensive 3D operations to loading phase
 * 
 * Responsibilities:
 * ├── Create and configure WebGL & CSS3D renderers
 * ├── Build optimized geometries (InstancedMesh replaces thousands of meshes)
 * ├── Generate complex road curves with Frenet frames
 * ├── Set up CSS3D checkpoints with React roots for dynamic content
 * ├── Pre-compile all shaders on GPU (eliminates runtime stutters)
 * ├── Attach DOM elements to container
 * └── Drive real loading progress via LoadingManager callbacks
 * 
 * Performance Benefits:
 * • Starfield: 6000+ individual meshes → 1 InstancedMesh (massive draw call reduction)
 * • Pre-compiled shaders = no runtime compilation lag
 * • Real progress tracking = better UX than fake loading bars
 * • Complete resource handoff = Journey3D only handles pure animation
 */
class ThreeJSResourceManager {
  constructor() {
    // THREE.js LoadingManager for driving actual progress
    this.manager = new THREE.LoadingManager();
    
    // Core rendering objects (created once, used by Journey3D)
    this.scene = null;
    this.cssScene = null;
    this.camera = null;
    this.renderer = null;
    this.cssRenderer = null;
    
    // Journey-specific geometry and curves
    this.roadCurve = null;
    this.frenetFrames = null;
    this.checkpoints = [];
    
    // Optimized mesh objects for performance
    this.starfieldMesh = null; // Single InstancedMesh for thousands of stars
    this.roadGeometry = null;
    this.roadMaterial = null;
    this.roadLine = null;
    
    // State and lifecycle management
    this.isCompiled = false;
    
    this.journeyLength = journeyData.length;
    
    // Callbacks for UI progress updates
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onResourcesReady = null;
  }

  /**
   * Configure LoadingManager callbacks to drive UI progress bar
   * Maps actual resource creation phases to user-visible progress
   */
  setCallbacks(onProgress, onComplete, onError, onResourcesReady) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.onResourcesReady = onResourcesReady;
    
    this.manager.onStart = () => {
      if (this.onProgress) this.onProgress(0, 'Starting resource creation...');
    };
    
    this.manager.onProgress = (url, loaded, total) => {
      const progressPercentage = Math.round((loaded / total) * 100);
      if (this.onProgress) this.onProgress(progressPercentage, `Loading resources... (${loaded}/${total})`);
    };
    
    this.manager.onLoad = () => {
      if (this.onProgress) this.onProgress(100, 'All resources loaded successfully!');
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 500);
    };
    
    this.manager.onError = (url) => {
      console.error('Failed to load resource:', url);
      if (this.onError) this.onError(`Failed to load: ${url}`);
    };
  }

  /**
   * MAIN INITIALIZATION: Execute all resource creation phases
   * ENHANCED ERROR HANDLING: Each phase wrapped in try-catch
   * GUARANTEED COMPLETION: onResourcesReady always fires
   */
  async initializeResources(container) {
    console.log('🚀 ThreeJSResourceManager: Starting resource initialization');
    let lastKnownResources = null;
    
    try {
      console.log('📋 Phase 1: Creating renderers...');
      await this.createRenderers(container);
      
      console.log('📋 Phase 2: Creating scene...');
      await this.createScene();
      
      console.log('📋 Phase 3: Creating camera...');
      await this.createCamera();
      
      console.log('📋 Phase 4: Creating starfield...');
      await this.createStarfieldInstancedMesh();
      
      console.log('📋 Phase 5: Creating road geometry...');
      await this.createRoadGeometry();
      
      console.log('📋 Phase 6: Creating checkpoints...');
      await this.createCheckpointObjects();
      
      console.log('📋 Phase 7: Compiling shaders...');
      await this.compileShaders();
      
      // Create complete resource package
      const resources = {
        scene: this.scene,
        cssScene: this.cssScene,
        camera: this.camera,
        renderer: this.renderer,
        cssRenderer: this.cssRenderer,
        roadCurve: this.roadCurve,
        frenetFrames: this.frenetFrames,
        checkpoints: this.checkpoints,
        resourceManager: this // Pass reference for React root cleanup
      };
      
      lastKnownResources = resources;
      console.log('✅ All resources created successfully');
      
      // Trigger LoadingManager completion with resources
      if (this.onResourcesReady) {
        console.log('📦 Calling onResourcesReady with complete resources');
        this.onResourcesReady(resources);
      }
      
      // Trigger LoadingManager onLoad
      this.manager.onLoad();
      
      return resources;
    } catch (error) {
      console.error('🚨 Resource initialization failed:', error);
      
      // Create partial resource package for error recovery
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
        isPartial: true // Flag to indicate incomplete resources
      };
      
      console.log('📦 Calling onResourcesReady with partial resources for error recovery');
      if (this.onResourcesReady) {
        this.onResourcesReady(partialResources);
      }
      
      if (this.onError) {
        this.onError(error.message);
      }
      
      throw error;
    }
  }

  /**
   * PHASE 1: Create and configure both renderers, attach to DOM
   * WebGL renderer handles 3D objects, CSS3D handles HTML elements in 3D space
   * PERFORMANCE: Cap pixel ratio to prevent GPU overload on high-DPI displays
   */
  async createRenderers(container) {
    return new Promise((resolve, reject) => {
      try {
        if (this.onProgress) this.onProgress(5, 'Initializing 3D environment...');
        
        // WebGL renderer for stars, road, and 3D geometry
        this.renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        });
        
        // Cap pixel ratio to prevent GPU overload on high-DPI displays
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.zIndex = '1';
        
        // Performance optimizations
        this.renderer.shadowMap.enabled = false; // Disable shadows for better performance
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        console.log('🎮 WebGL renderer created with pixel ratio:', this.renderer.getPixelRatio());
        // Note: DOM attachment will be handled by Journey3D

        // CSS3D renderer for checkpoint cards and headers
        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.zIndex = '2';
        // Note: DOM attachment will be handled by Journey3D
        
        console.log('🎨 CSS3D renderer created');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * PHASE 2: Create main 3D scene and CSS3D scene with environmental settings
   */
  async createScene() {
    return new Promise((resolve) => {
      if (this.onProgress) this.onProgress(10, 'Creating scene...');
      
      // Main 3D scene with fog for atmospheric depth
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      this.scene.fog = new THREE.Fog(0x000000, 200 * SCENE_SCALE, 1000 * SCENE_SCALE);
      
      // CSS3D scene for HTML content in 3D space
      this.cssScene = new THREE.Scene();
      
      resolve();
    });
  }

  /**
   * PHASE 3: Create and configure perspective camera with journey-appropriate settings
   */
  async createCamera() {
    return new Promise((resolve) => {
      if (this.onProgress) this.onProgress(15, 'Setting up camera...');
      
      this.camera = new THREE.PerspectiveCamera(
        75, // Field of view for immersive experience
        window.innerWidth / window.innerHeight, 
        0.1, // Near clipping plane
        3000 * SCENE_SCALE // Far clipping plane scaled to scene
      );
      
      resolve();
    });
  }

  /**
   * PHASE 4: Create optimized starfield using InstancedMesh
   * 
   * PERFORMANCE OPTIMIZATION:
   * Before: 6000+ individual THREE.Mesh objects = 6000+ draw calls
   * After: 1 THREE.InstancedMesh = 1 draw call
   * 
   * This single change can improve framerate by 10-50x on lower-end devices
   */
  async createStarfieldInstancedMesh() {
    return new Promise((resolve) => {
      console.log('⭐ createStarfieldInstancedMesh: Starting starfield creation');
      if (this.onProgress) this.onProgress(20, 'Creating geometry buffers...');
      
      setTimeout(() => {
        console.log('⭐ createStarfieldInstancedMesh: Building instanced mesh');
        if (this.onProgress) this.onProgress(35, 'Building starfield mesh...');
        
        // Calculate star count based on journey length (reduced for performance)
        const starCount = Math.max(STAR_FIELD_MAX_INITIAL_STARS * 0.7, this.journeyLength * STAR_DENSITY_PER_CHECKPOINT * 0.8);
        
        // PERFORMANCE: Use low-poly geometry for better performance
        const starGeometry = new THREE.SphereGeometry(1, 6, 6); // Reduced from 8x8 to 6x6
        const starMaterial = new THREE.MeshBasicMaterial({ 
          transparent: true, 
          opacity: 0.8,
          depthWrite: false // Performance optimization for transparent objects
        });
        
        // InstancedMesh: One mesh, thousands of instances
        this.starfieldMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
        
        const dummy = new THREE.Object3D();
        
        // Configure each star instance: position, scale, color
        for (let i = 0; i < starCount; i++) {
          // Random 3D position
          const x = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
          const y = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
          const z = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
          dummy.position.set(x, y, z);
          
          // Random scale for variety
          const scale = THREE.MathUtils.randFloat(0.5, 2.5) * SCENE_SCALE * 0.2;
          dummy.scale.set(scale, scale, scale);
          
          // Update matrix and store
          dummy.updateMatrix();
          this.starfieldMesh.setMatrixAt(i, dummy.matrix);
          
          // Random brightness
          const intensity = THREE.MathUtils.randFloat(STAR_COLOR_MIN_INTENSITY, STAR_COLOR_MAX_INTENSITY);
          this.starfieldMesh.setColorAt(i, new THREE.Color(intensity, intensity, intensity));
        }
        
        // Upload to GPU
        this.starfieldMesh.instanceMatrix.needsUpdate = true;
        this.starfieldMesh.instanceColor.needsUpdate = true;
        
        this.scene.add(this.starfieldMesh);
        
        console.log('✅ createStarfieldInstancedMesh: Starfield created successfully with', starCount, 'stars');
        resolve();
      }, 100);
    });
  }

  /**
   * PHASE 5: Generate complex road curve using mathematical functions
   * Creates smooth, interesting path through 3D space with computed Frenet frames
   */
  async createRoadGeometry() {
    return new Promise((resolve) => {
      console.log('🛤️ createRoadGeometry: Starting road curve generation');
      if (this.onProgress) this.onProgress(50, 'Generating journey path...');
      
      setTimeout(() => {
        console.log('🛤️ createRoadGeometry: Computing road points and curve');
        // PERFORMANCE: Reduce road complexity by 50% for better performance
        const roadPoints = Math.max(600, this.journeyLength * ROAD_POINTS_PER_CHECKPOINT * 0.5);
        const points = [];
        
        // Generate curved path using sinusoidal functions for natural movement
        for (let i = 0; i <= roadPoints; i++) {
          const t = (i / roadPoints) * Math.PI * (this.journeyLength + ROAD_CURVE_LENGTH_MULTIPLIER);
          
          // Layered sine/cosine waves create organic, flowing curves
          const x = Math.sin(t * ROAD_X_FREQUENCY_1) * ROAD_X_AMPLITUDE_1 + 
                   Math.cos(t * ROAD_X_FREQUENCY_2) * ROAD_X_AMPLITUDE_2;
          const y = Math.cos(t * ROAD_Y_FREQUENCY_1) * ROAD_Y_AMPLITUDE_1 + 
                   Math.sin(t * ROAD_Y_FREQUENCY_2) * ROAD_Y_AMPLITUDE_2;
          const z = i * ROAD_Z_SPACING - (roadPoints * 2);
          
          points.push(new THREE.Vector3(x, y, z).multiplyScalar(SCENE_SCALE));
        }
        
        // Create smooth spline curve and compute Frenet frames for camera orientation
        this.roadCurve = new THREE.CatmullRomCurve3(points);
        this.frenetFrames = this.roadCurve.computeFrenetFrames(roadPoints + 500, false);

        // Create visible road line
        this.roadMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        const linePoints = this.roadCurve.getPoints(roadPoints + 500);
        this.roadGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        this.roadLine = new THREE.Line(this.roadGeometry, this.roadMaterial);
        
        this.scene.add(this.roadLine);
        
        console.log('✅ createRoadGeometry: Road curve created successfully with', roadPoints, 'points');
        resolve();
      }, 100);
    });
  }

  /**
   * PHASE 6: Create CSS3D checkpoint objects with React roots
   * SINGLE CREATION: Elements created once, stored in checkpoints array
   * CSS CUSTOM PROPERTIES: --offscreen-x set for slide-in direction
   * NO DOM ATTACHMENT: Deferred to Journey3D initialization
   * GUARD: Prevent duplicate creation if checkpoints already exist
   */
  async createCheckpointObjects() {
    return new Promise((resolve) => {
      if (this.onProgress) this.onProgress(70, 'Loading journey assets...');
      
      setTimeout(() => {
        // ── GUARD: Prevent duplicate checkpoint creation ──
        if (this.checkpoints.length > 0) {
          console.log('🚫 Checkpoints already exist, skipping creation. Current count:', this.checkpoints.length);
          console.log('📊 CSS3D scene children before skip:', this.cssScene.children.length);
          resolve();
          return;
        }
        
        console.log('🎯 createCheckpointObjects: Starting checkpoint creation for', journeyData.length, 'items');
        console.log('📊 CSS3D scene children before creation:', this.cssScene.children.length);
        
        journeyData.forEach((data, i) => {
          console.log(`📍 Creating checkpoint ${i}:`, data.title);
          
          // ── POSITIONING: Compute exactly once ──
          const stopT = (i + 1) / (this.journeyLength + 1);
          const objectT = stopT + OBJECT_PLACEMENT_OFFSET_T;
          
          const position = this.roadCurve.getPointAt(objectT);
          const frameIndex = Math.floor(objectT * (this.frenetFrames.binormals.length - 1));
          const binormal = this.frenetFrames.binormals[frameIndex];

          // ── ALTERNATING SIDES: Even = right (1), Odd = left (-1) ──
          const side = i % 2 === 0 ? 1 : -1;
          console.log(`📍 Checkpoint ${i} side:`, side === 1 ? 'RIGHT' : 'LEFT');
          
          // ── WORLD-SPACE OFFSETS: Compute using binormal ──
          const cardOffsetDistance = LATERAL_OFFSET_DISTANCE_CARD * SCENE_SCALE;
          const headerOffsetDistance = LATERAL_OFFSET_DISTANCE_HEADER * SCENE_SCALE;
          
          const cardOffset = binormal.clone().multiplyScalar(cardOffsetDistance * side);
          const headerOffset = binormal.clone().multiplyScalar(headerOffsetDistance * -side);

          // ── CARD ELEMENT: Create with CSS custom property ──
          const cardElement = document.createElement('div');
          cardElement.className = 'journey-card';
          
          // Set CSS custom property for slide-in direction
          const cardOffscreenX = side > 0 ? '150px' : '-150px'; // Right side slides from right, left from left
          cardElement.style.setProperty('--offscreen-x', cardOffscreenX);
          console.log(`🎨 Card ${i} --offscreen-x:`, cardOffscreenX);
          
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
          
          // ── HEADER ELEMENT: Create with opposite slide direction ──
          const headerElement = document.createElement('div');
          headerElement.className = 'journey-header-overlay';
          
          // Header slides from opposite side of card
          const headerOffscreenX = side > 0 ? '-150px' : '150px';
          headerElement.style.setProperty('--offscreen-x', headerOffscreenX);
          console.log(`🎨 Header ${i} --offscreen-x:`, headerOffscreenX);

          // ── CSS3D OBJECTS: Position and scale in 3D space ──
          const cardObject = new CSS3DObject(cardElement);
          cardObject.position.copy(position).add(cardOffset);
          cardObject.scale.set(1.5, 1.5, 1); // 150% size - blow up for prominence
          
          const headerObject = new CSS3DObject(headerElement);
          headerObject.position.copy(position).add(headerOffset);
          headerObject.scale.set(1.3, 1.3, 1); // 130% size - prominent but balanced
          
          // ── ADD TO CSS3D SCENE: Single addition, no re-appending ──
          this.cssScene.add(cardObject);
          this.cssScene.add(headerObject);
          console.log(`✅ Added checkpoint ${i} objects to CSS3D scene`);
          console.log(`📏 Card ${i} dimensions: ${cardElement.style.width || '600px'} × ${cardElement.style.height || '450px'}, 3D scale: 1.5x`);
          console.log(`📏 Header ${i} dimensions: ${headerElement.style.width || '500px'} × ${headerElement.style.height || '180px'}, 3D scale: 1.3x`);

          // ── REACT ROOT: Create for dynamic content rendering ──
          const root = createRoot(headerElement);

          // ── STORE: Single creation, stored in checkpoints array ──
          this.checkpoints.push({ 
            stopT, 
            cardObject, 
            headerObject, 
            data, 
            triggered: false,
            root,
            index: i
          });
        });
        
        console.log('✅ createCheckpointObjects: All', this.checkpoints.length, 'checkpoints created and stored');
        console.log('📊 CSS3D scene children after creation:', this.cssScene.children.length);
        resolve();
      }, 100);
    });
  }

  /**
   * PHASE 7: Pre-compile all shaders on GPU
   * 
   * PERFORMANCE BENEFIT:
   * Eliminates runtime shader compilation stutters that cause frame drops
   * All materials are compiled and cached on GPU during loading
   */
  async compileShaders() {
    return new Promise((resolve) => {
      console.log('🎨 compileShaders: Starting shader compilation');
      if (this.onProgress) this.onProgress(85, 'Compiling shaders...');
      
      setTimeout(() => {
        console.log('🎨 compileShaders: Compiling all scene materials');
        // Force compilation of all scene materials/shaders
        this.renderer.compile(this.scene, this.camera);
        this.isCompiled = true;
        
        if (this.onProgress) this.onProgress(95, 'Finalizing scene...');
        
        console.log('✅ compileShaders: Shader compilation completed successfully');
        resolve();
      }, 200);
    });
  }

  /**
   * Cleanup THREE.js resources only (called from Loader cleanup)
   * Does NOT dispose React roots - that's handled by Journey3D
   */
  disposeThreeJSResources() {
    console.log('🧹 ThreeJSResourceManager: Disposing THREE.js resources only');
    
    // ── THREE.JS RESOURCES: Dispose geometries and materials ──
    if (this.starfieldMesh) {
      this.starfieldMesh.geometry.dispose();
      this.starfieldMesh.material.dispose();
      console.log('🗑️ Disposed starfield mesh resources');
    }
    
    if (this.roadGeometry) {
      this.roadGeometry.dispose();
      console.log('🗑️ Disposed road geometry');
    }
    
    if (this.roadMaterial) {
      this.roadMaterial.dispose();
      console.log('🗑️ Disposed road material');
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      console.log('🗑️ Disposed WebGL renderer');
      // Note: DOM elements are managed by Journey3D
    }
    
    if (this.cssRenderer) {
      console.log('🗑️ CSS3D renderer cleanup complete');
      // Note: DOM elements are managed by Journey3D
    }
    
    console.log('✅ ThreeJSResourceManager: THREE.js cleanup completed');
  }

  /**
   * Dispose React roots only (called from Journey3D cleanup)
   * PERFORMANCE: Lazy cleanup to allow quick re-entry without thrashing
   */
  disposeReactRoots() {
    console.log('🧹 ThreeJSResourceManager: Scheduling lazy React root disposal');
    
    // ── REACT ROOTS: Lazy cleanup allows quick re-entry without thrashing ──
    this.checkpoints.forEach((cp, index) => {
      if (cp.root) {
        // PERFORMANCE: Delay cleanup to allow potential re-entry
        setTimeout(() => {
          try {
            cp.root.unmount();
            console.log(`🗑️ Lazily unmounted React root for checkpoint ${index}`);
          } catch (error) {
            console.warn(`⚠️ Error unmounting React root for checkpoint ${index}:`, error);
          }
        }, 1000); // 1 second delay instead of immediate
      }
    });
    
    console.log('✅ ThreeJSResourceManager: Lazy React roots cleanup scheduled');
  }

  /**
   * Legacy method - prefer disposeThreeJSResources() or disposeReactRoots()
   */
  dispose() {
    console.log('⚠️ ThreeJSResourceManager: Using legacy dispose() method');
    this.disposeThreeJSResources();
    this.disposeReactRoots();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN LOADER COMPONENT - Resource creation UI with real progress tracking
// ──────────────────────────────────────────────────────────────────────────────

export default function Loader({ onComplete, onResourcesReady }) {
  // ── UI State Management ──
  const [progress, setProgress] = useState(0);
  const [currentLoadingText, setCurrentLoadingText] = useState('Booting up portfolio...');
  const [cameraPhase, setCameraPhase] = useState('initial');
  const [showButton, setShowButton] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  // ── Component References ──
  const containerRef = useRef(null);
  const resourceManagerRef = useRef(null);
  const hasInitializedRef = useRef(false); // Prevent duplicate initialization

  // ── Initialize UI animations ──
  useEffect(() => {
    setShowContent(true);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // RESOURCE INITIALIZATION: Single call to build complete 3D environment
  // GUARD: Prevent duplicate initialization with hasInitialized flag
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    
    const initializeResources = async () => {
      if (!containerRef.current || hasInitializedRef.current) {
        console.log('🚫 Skipping resource initialization - already initialized or no container');
        return;
      }
      
      console.log('🚀 Starting SINGLE resource initialization');
      
      const resourceManager = new ThreeJSResourceManager();
      resourceManagerRef.current = resourceManager;
      
      // Configure progress callbacks to drive UI
      resourceManager.setCallbacks(
        // Progress updates from actual resource creation
        (progressValue, text) => {
          if (isMounted) {
            setProgress(progressValue);
            setCurrentLoadingText(text);
          }
        },
        // Completion triggers button phase
        () => {
          console.log('🎉 LoadingManager onLoad fired');
          if (isMounted) {
          setTimeout(() => {
              console.log('📱 Setting camera phase to moveToButton');
            setCameraPhase('moveToButton');
          }, 500);
          }
        },
        // Error handling with recovery
        (error) => {
          console.error('🚨 Resource loading error:', error);
          if (isMounted) {
            setCurrentLoadingText('Resource loading failed. Attempting recovery...');
            // Still allow progression after error with fallback resources
            setTimeout(() => {
              console.log('🔄 Error recovery: Moving to button phase anyway');
              setCameraPhase('moveToButton');
            }, 2000);
          }
        },
        // Resources ready callback - ALWAYS CALLED
        (resources) => {
          console.log('📦 onResourcesReady fired with resources:', {
            hasScene: !!resources.scene,
            hasCamera: !!resources.camera,
            hasRenderer: !!resources.renderer,
            checkpointCount: resources.checkpoints?.length || 0,
            isPartial: resources.isPartial || false
          });
          
          if (isMounted && onResourcesReady) {
            onResourcesReady(resources);
          }
        }
      );
      
      try {
        // SINGLE RESOURCE CREATION CALL - Everything built here
        await resourceManager.initializeResources(containerRef.current);
        
        // Only set flag after successful completion
        hasInitializedRef.current = true;
        console.log('✅ Resource initialization completed successfully');
      } catch (error) {
        console.error('🚨 Failed to initialize resources:', error);
        // Don't set hasInitialized flag on error - allow retry
      }
    };
    
    initializeResources();
    
    // Cleanup on unmount - DO NOT dispose React roots here
    return () => {
      console.log('🧹 Loader: Component unmounting');
      isMounted = false;
      if (resourceManagerRef.current) {
        // Only dispose THREE.js resources, NOT React roots
        resourceManagerRef.current.disposeThreeJSResources();
      }
    };
  }, []); // Run only once - no dependencies to prevent re-initialization loops

  // ── Button Display Logic ──
  useEffect(() => {
    if (cameraPhase === 'moveToButton') {
      console.log('📱 Camera phase changed to moveToButton, showing button in 1.5s');
      setTimeout(() => {
        console.log('🔘 Showing "Let\'s Go" button');
        setShowButton(true);
      }, 1500);
    }
  }, [cameraPhase]);

  // ── Fallback Mechanism: Ensure UI always progresses ──
  useEffect(() => {
    // If we're still loading after 15 seconds, force progression
    const fallbackTimer = setTimeout(() => {
      if (cameraPhase === 'initial') {
        console.log('⏰ Fallback timer: Forcing progression after 15 seconds');
        setCameraPhase('moveToButton');
      }
    }, 15000);

    return () => clearTimeout(fallbackTimer);
  }, [cameraPhase]);

  // ── Transition to Journey3D ──
  const handleLetSGoClick = () => {
    console.log('👆 "Let\'s Go" button clicked, starting transition');
    setShowButton(false);
    setCameraPhase('fadeToBlack');
    
    setTimeout(() => {
      console.log('🎬 Transition complete, calling onComplete');
      setCameraPhase('complete');
      if (onComplete) {
        onComplete();
      } else {
        console.warn('⚠️ onComplete callback not provided');
      }
    }, 2000);
  };

  // ── Hide component when loading complete ──
  if (cameraPhase === 'complete') return null;

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Elegant loading UI with real resource creation in background
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col min-h-screen min-w-full bg-black major-mono-display-regular overflow-hidden"
    >
      {/* Background animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Beams beamWidth={0.8} beamHeight={14} beamNumber={4} lightColor="#fff" speed={2} noiseIntensity={1.75} scale={0.18} rotation={200} />
      </div>

      {/* Main UI container with camera movement animation */}
      <motion.div
        className="relative w-full h-full z-10"
        animate={{
          y: cameraPhase === 'initial' ? 0 : 
             cameraPhase === 'moveToButton' ? '-100vh' :
             cameraPhase === 'fadeToBlack' ? '-200vh' : '-200vh'
        }}
        transition={{
          duration: cameraPhase === 'moveToButton' ? 2 : 
                   cameraPhase === 'fadeToBlack' ? 1.5 : 0,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {/* Loading Screen */}
        <div className="relative w-full h-screen flex flex-col">
          {/* Current time display */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-6 left-8 text-xs md:text-sm opacity-80 tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={`Local time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white/70"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          {/* Portfolio branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute bottom-8 left-8 text-lg md:text-2xl font-bold tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={"sriujjwalreddy.com"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-lg md:text-2xl text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <DecryptedText
              text={"since 2022"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs mt-2 text-white/70"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          {/* Welcome message */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-xs md:text-sm text-right opacity-80 tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={"Welcome"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <DecryptedText
              text={"To My Portfolio"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          {/* Loading progress display - Shows real resource creation progress */}
          <div className="flex flex-1 max-w-8xl mx-auto items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-row items-center justify-center w-full max-w-4xl mx-auto gap-16 md:gap-32"
            >
              {/* Loading states list (desktop only) */}
              <div className="hidden md:flex flex-col items-end mb-10 justify-center min-w-[260px]">
                <LoaderCore loadingStates={loadingStates} progress={progress} currentText={currentLoadingText} />
              </div>
              
              {/* Progress percentage and bar */}
              <div className="flex flex-col items-center justify-center w-[260px]">
                <span className="text-5xl md:text-6xl font-bold text-white select-none tracking-widest mb-4" style={{ letterSpacing: '0.15em' }}>
                  {Math.floor(progress)}
                </span>
                <div className="w-44 h-[2px] bg-white/20 mb-6 relative overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-white"
                    style={{ width: `${progress}%` }}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* "Let's Go" Button Screen */}
        <div className="relative w-full h-screen flex items-center justify-center">
          {showButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
                boxShadow: [
                  "0 0 20px rgba(255, 255, 255, 0.3)",
                  "0 0 40px rgba(255, 255, 255, 0.5)",
                  "0 0 20px rgba(255, 255, 255, 0.3)"
                ]
              }}
              transition={{ 
                duration: 0.8,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={handleLetSGoClick}
              className="major-mono-display-regular px-12 py-6 bg-white text-black rounded-lg text-2xl font-bold tracking-widest hover:bg-white/90 transition-all active:scale-95 border-2 border-white"
              style={{ letterSpacing: '0.1em' }}
            >
              LET'S GO
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Final fade to black transition */}
      <motion.div
        className="absolute inset-0 bg-black z-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: cameraPhase === 'fadeToBlack' ? 1 : 0 
        }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </div>
  );
}