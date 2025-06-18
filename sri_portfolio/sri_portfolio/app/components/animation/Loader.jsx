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
// CLEAN UI - No verbose loading states, just smooth progress indication
// ──────────────────────────────────────────────────────────────────────────────

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
const OBJECT_PLACEMENT_OFFSET_T = 0.08;
const LATERAL_OFFSET_DISTANCE_CARD = 200;   // ↓ from 250 - bring cards closer to road
const LATERAL_OFFSET_DISTANCE_HEADER = 150; // ↓ from 250 - bring headers closer to road

// ──────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS - Clean interface elements
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// CIRCULAR PROGRESS COMPONENT - Clean progress indicator
// ──────────────────────────────────────────────────────────────────────────────
function CircularProgress({ progress, showStartButton, onStartClick }) {
  const radius = 90;
  const strokeWidth = 5;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, angle: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [fillProgress, setFillProgress] = useState(0);
  const containerRef = useRef(null);
  const fillRef = useRef(null);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      const angle = Math.atan2(mouseY, mouseX);
      
      // Convert to percentage position within circle
      const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      const normalizedDistance = Math.min(distance / radius, 1);
      
      setMousePosition({ 
        x: mouseX, 
        y: mouseY, 
        angle: angle,
        distance: normalizedDistance,
        centerX: centerX,
        centerY: centerY
      });
    }
  };

  // Handle fill animation
  const handleMouseEnter = () => {
    setIsHovered(true);
    setFillProgress(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setFillProgress(0);
  };

  return (
    <motion.div 
      ref={containerRef}
      className="relative flex items-center justify-center group"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5)) drop-shadow(0 4px 15px rgba(0,0,0,0.3))',
        transform: 'translateZ(0)'
      }}
    >
      {/* Three.js style depth shadow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 40% 40%, rgba(0,0,0,0.4) 0%, transparent 70%)',
          transform: 'translateY(8px) translateX(4px) scale(1.1)',
          zIndex: -1,
          filter: 'blur(12px)'
        }}
      />

      {/* Liquid glass background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transform: 'scale(0.9)'
        }}
        animate={{
          background: isHovered 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.03)'
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Circular Progress Ring */}
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 relative z-10"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
        }}
      >
        <defs>
          {/* Gradient for directional fill */}
          <radialGradient 
            id="directionalFill" 
            cx={showStartButton ? `${50 + (mousePosition.x / radius) * 50}%` : "50%"}
            cy={showStartButton ? `${50 + (mousePosition.y / radius) * 50}%` : "50%"}
            r="100%"
          >
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="40%" stopColor="white" stopOpacity="0.95" />
            <stop offset="80%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0.6" />
          </radialGradient>
          
          {/* Mask for directional reveal */}
          <mask id="directionalMask">
            <rect width="100%" height="100%" fill="black" />
            <motion.circle
              fill="white"
              initial={{ 
                r: 0,
                cx: radius,
                cy: radius
              }}
              animate={{ 
                r: fillProgress * (normalizedRadius * 1.5), // Expand beyond circle bounds to ensure full fill
                cx: radius + mousePosition.x,
                cy: radius + mousePosition.y
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.1, 0.25, 1],
                type: "tween"
              }}
            />
          </mask>
        </defs>

        {/* Background circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.08)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Directional fill circle */}
        {showStartButton && (
          <circle
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            fill="url(#directionalFill)"
            stroke="none"
            mask="url(#directionalMask)"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))'
            }}
          />
        )}
        
        {/* Progress circle */}
        <motion.circle
          stroke="white"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
            zIndex: 2
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {!showStartButton ? (
          <motion.div
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: progress === 100 ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          >
            <DecryptedText
              text={Math.floor(progress).toString()}
              speed={30}
              maxIterations={8}
              sequential={false}
              revealDirection="center"
              className="major-mono-display-regular text-4xl md:text-5xl font-bold text-white select-none tracking-wider"
              encryptedClassName="text-white/20"
              animateOn="view"
            />
            <motion.div
              className="mt-2 w-8 h-0.5 bg-white/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <motion.button
              onClick={onStartClick}
              className="relative px-8 py-4 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}
            >
              <DecryptedText
                text="START"
                speed={40}
                maxIterations={12}
                sequential={true}
                revealDirection="center"
                className={`major-mono-display-regular text-lg md:text-xl font-bold tracking-widest relative z-10 transition-colors duration-300 ${
                  isHovered ? 'text-black' : 'text-white'
                }`}
                encryptedClassName={isHovered ? "text-black/50" : "text-white/30"}
                animateOn="view"
              />
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
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
      if (this.onProgress) this.onProgress(0);
    };
    
    this.manager.onProgress = (url, loaded, total) => {
      const progressPercentage = Math.round((loaded / total) * 100);
      if (this.onProgress) this.onProgress(progressPercentage);
    };
    
    this.manager.onLoad = () => {
      if (this.onProgress) this.onProgress(100);
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
  const [showContent, setShowContent] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [textAnimationsComplete, setTextAnimationsComplete] = useState({
    localTime: false,
    portfolio: false,
    since: false,
    welcome1: false,
    welcome2: false
  });
  
  // ── Component References ──
  const containerRef = useRef(null);
  const resourceManagerRef = useRef(null);
  const hasInitializedRef = useRef(false); // Prevent duplicate initialization

  // ── Initialize UI animations ──
  useEffect(() => {
    setShowContent(true);
  }, []);

  // ── Track text animation completion ──
  const handleTextAnimationComplete = (textKey) => {
    setTextAnimationsComplete(prev => ({
      ...prev,
      [textKey]: true
    }));
  };

  // ── Check if all text animations are complete ──
  const allTextAnimationsComplete = Object.values(textAnimationsComplete).every(Boolean);

  // ── Show start button when both progress is 100% and text animations are complete ──
  useEffect(() => {
    if (progress >= 100 && allTextAnimationsComplete) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setShowStartButton(true);
      }, 800);
    }
  }, [progress, allTextAnimationsComplete]);

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
        (progressValue) => {
          if (isMounted) {
            setProgress(progressValue);
          }
        },
        // Completion - no additional actions needed
        () => {
          console.log('🎉 LoadingManager onLoad fired');
        },
        // Error handling with recovery
        (error) => {
          console.error('🚨 Resource loading error:', error);
          if (isMounted) {
            // Still allow progression after error
            setProgress(100);
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

  // ── Transition to Journey3D ──
  const handleStartClick = () => {
    console.log('👆 START button clicked, starting transition');
    if (onComplete) {
      onComplete();
    } else {
      console.warn('⚠️ onComplete callback not provided');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Enhanced loading interface with Major Mono styling and animations
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] min-h-screen min-w-full bg-black overflow-hidden major-mono-display-regular"
    >
      {/* Clean background animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Beams beamWidth={0.8} beamHeight={14} beamNumber={4} lightColor="#fff" speed={2} noiseIntensity={1.75} scale={0.18} rotation={200} />
      </div>

      {/* Main container with enhanced spacing */}
      <div className="relative w-full h-screen flex flex-col z-10 p-6 md:p-12">
        {/* Current time display with slide-in animation */}
        <motion.div 
          initial={{ opacity: 0, x: -50, y: -20 }}
          animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -50, y: showContent ? 0 : -20 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="absolute top-8 left-8 md:top-12 md:left-12 group cursor-default"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
            transform: 'translateZ(0)'
          }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
          >
            {/* Three.js style shadow */}
            <div
              className="absolute -inset-2 rounded-lg opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                transform: 'translateY(3px) translateX(2px)',
                filter: 'blur(4px)',
                zIndex: -1
              }}
            />
            
            <DecryptedText
              text={`Local time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
              speed={35}
              maxIterations={12}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-sm md:text-base text-white/70 font-medium tracking-wider relative z-10 px-2 py-1"
              encryptedClassName="text-white/20"
              animateOn="view"
              onAnimationComplete={() => handleTextAnimationComplete('localTime')}
            />
          </motion.div>
        </motion.div>

        {/* Portfolio branding with slide-in animation */}
        <motion.div 
          initial={{ opacity: 0, x: -60, y: 30 }}
          animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -60, y: showContent ? 0 : 30 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="absolute bottom-8 left-8 md:bottom-12 md:left-12 flex flex-col gap-3 group cursor-default"
          style={{
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5)) drop-shadow(0 3px 10px rgba(0,0,0,0.3))',
            transform: 'translateZ(0)'
          }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.02, x: 5, y: -3 }}
            transition={{ duration: 0.4 }}
          >
            {/* Three.js style depth shadow */}
            <div
              className="absolute -inset-3 rounded-lg opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                transform: 'translateY(4px) translateX(3px)',
                filter: 'blur(8px)',
                zIndex: -1
              }}
            />
            
            <div className="relative z-10 px-3 py-2">
              <DecryptedText
                text={"sriujjwalreddy.com"}
                speed={35}
                maxIterations={15}
                sequential={true}
                revealDirection="start"
                className="major-mono-display-regular text-2xl md:text-4xl text-white font-bold tracking-widest"
                encryptedClassName="text-white/20"
                animateOn="view"
                onAnimationComplete={() => handleTextAnimationComplete('portfolio')}
              />
              
              <motion.div
                className="mt-2 mb-1 h-0.5 bg-gradient-to-r from-white/40 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1.5 }}
                style={{
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
                }}
              />
              
              <DecryptedText
                text={"since 2022"}
                speed={35}
                maxIterations={10}
                sequential={true}
                revealDirection="start"
                className="major-mono-display-regular text-sm md:text-lg text-white/60 font-medium tracking-wider"
                encryptedClassName="text-white/15"
                animateOn="view"
                onAnimationComplete={() => handleTextAnimationComplete('since')}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Welcome message with slide-in animation */}
        <motion.div 
          initial={{ opacity: 0, x: 60, y: -20 }}
          animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : 60, y: showContent ? 0 : -20 }}
          transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
          className="absolute right-8 top-1/2 md:right-12 -translate-y-1/2 text-right flex flex-col gap-3 group cursor-default"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
            transform: 'translateZ(0)'
          }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.02, x: -5, y: -2 }}
            transition={{ duration: 0.4 }}
          >
            {/* Three.js style shadow */}
            <div
              className="absolute -inset-3 rounded-lg opacity-60"
              style={{
                background: 'linear-gradient(225deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                transform: 'translateY(3px) translateX(-2px)',
                filter: 'blur(4px)',
                zIndex: -1
              }}
            />
            
            <div className="relative z-10 px-3 py-2">
              <DecryptedText
                text={"Welcome"}
                speed={35}
                maxIterations={12}
                sequential={true}
                revealDirection="end"
                className="major-mono-display-regular text-lg md:text-xl text-white font-medium tracking-widest"
                encryptedClassName="text-white/20"
                animateOn="view"
                onAnimationComplete={() => handleTextAnimationComplete('welcome1')}
              />
              
              <DecryptedText
                text={"To My Portfolio"}
                speed={35}
                maxIterations={12}
                sequential={true}
                revealDirection="end"
                className="major-mono-display-regular text-lg md:text-xl text-white/80 font-medium tracking-widest"
                encryptedClassName="text-white/20"
                animateOn="view"
                onAnimationComplete={() => handleTextAnimationComplete('welcome2')}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Center circular progress */}
        <div className="flex-1 flex items-center justify-center">
          <CircularProgress 
            progress={progress} 
            showStartButton={showStartButton}
            onStartClick={handleStartClick}
          />
        </div>
      </div>
    </div>
  );
}