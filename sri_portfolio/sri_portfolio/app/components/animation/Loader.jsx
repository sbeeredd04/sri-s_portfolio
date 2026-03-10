import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

import DecryptedText from './DecryptedText';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RGBELoader } from 'three-stdlib';
import { createRoot } from 'react-dom/client';
import journeyData from '../../json/journey.json';
import { preloadWallpapers } from '../../config/wallpapers';


// Client-only time component to prevent hydration mismatch
function ClientTime({ onAnimationComplete, showContent }) {
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted and set initial time
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));

    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
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
          text={`Local time: ${currentTime}`}
          speed={35}
          maxIterations={12}
          sequential={true}
          revealDirection="start"
          className="major-mono-display-regular text-sm md:text-base text-white/70 font-medium tracking-wider relative z-10 px-2 py-1"
          encryptedClassName="text-white/20"
          animateOn="view"
          onAnimationComplete={mounted ? onAnimationComplete : undefined}
        />
      </motion.div>
    </motion.div>
  );
}

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
// CIRCULAR PROGRESS COMPONENT - Clean progress indicator with interactive elements
// ──────────────────────────────────────────────────────────────────────────────
function CircularProgress({ progress, showStartButton, onStartClick }) {
  const radius = 90;
  const strokeWidth = 5;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  
  // Ensure progress bar correctly reflects the actual progress percentage
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, angle: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [fillProgress, setFillProgress] = useState(0);
  const containerRef = useRef(null);

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
    >


      {/* Liquid glass background - only show when START button is visible */}
              {showStartButton && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
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
        )}
      
      {/* Circular Progress Ring */}
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 relative z-10"
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
          stroke="rgba(255, 255, 255, 0)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Directional fill circle - only visible on hover when START button is shown */}
        {showStartButton && isHovered && (
          <circle
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            fill="url(#directionalFill)"
            stroke="none"
            mask="url(#directionalMask)"
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
          animate={{ 
            strokeDashoffset: strokeDashoffset
          }}
          transition={{ 
            strokeDashoffset: { duration: 0.3, ease: "easeOut" }
          }}
          style={{
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
            animate={{ opacity: clampedProgress >= 100 ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="major-mono-display-regular text-4xl md:text-5xl font-bold text-white select-none tracking-wider"
              key={Math.floor(clampedProgress)} // Re-render when progress changes significantly
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {Math.floor(clampedProgress)}
            </motion.div>
            <motion.div
              className="mt-2 w-8 h-0.5 bg-white/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: clampedProgress / 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
              className="relative px-8 py-4 transition-all duration-300 cursor-pointer bg-transparent border-none"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'transparent'
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
    
    // Environment effects
    this.pmremGenerator = null;
    this.environmentMap = null;
    
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
   * Configure callbacks for unified smooth progress tracking
   */
  setCallbacks(onProgress, onComplete, onError, onResourcesReady) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.onResourcesReady = onResourcesReady;
    
    // Total phases for progress calculation
    this.totalPhases = 8; // renderers, scene, camera, environment, starfield, road, checkpoints, shaders
    this.currentPhase = 0;
    
    // Progress tracking
    this.phaseProgress = 0; // Progress within current phase (0-1)
    this.overallProgress = 0; // Overall progress (0-100)
  }

  /**
   * Update progress based on current phase and phase progress
   */
  updateProgress(phaseProgress = 1.0) {
    this.phaseProgress = Math.min(phaseProgress, 1.0);
    
    // Calculate overall progress: (completed phases + current phase progress) / total phases
    const completedPhases = this.currentPhase;
    const currentPhaseContribution = this.phaseProgress;
    const rawProgress = (completedPhases + currentPhaseContribution) / this.totalPhases;
    
    // Cap at 95% until everything is truly complete
    this.overallProgress = Math.min(rawProgress * 95, 95);
    
    if (this.onProgress) {
      this.onProgress(this.overallProgress);
    }
  }

  /**
   * Complete current phase and move to next
   */
  completePhase() {
    this.currentPhase++;
    this.phaseProgress = 0;
    this.updateProgress(1.0);
  }

  /**
   * Mark all phases as complete (100%)
   */
  completeAllPhases() {
    this.overallProgress = 100;
    if (this.onProgress) {
      this.onProgress(100);
    }
  }

  /**
   * MAIN INITIALIZATION: Execute all resource creation phases
   * Error handling for each phase with guaranteed completion callback
   */
  async initializeResources(container) {
    try {
      // Phase 1: Create renderers
      this.updateProgress(0);
      await this.createRenderers(container);
      this.completePhase();
      
      // Phase 2: Create scene
      await this.createScene();
      this.completePhase();
      
      // Phase 3: Create camera
      await this.createCamera();
      this.completePhase();
      
      // Phase 4: Setup environment
      await this.createEnvironment();
      this.completePhase();
      
      // Phase 5: Create starfield
      await this.createStarfieldInstancedMesh();
      this.completePhase();
      
      // Phase 6: Create road geometry
      await this.createRoadGeometry();
      this.completePhase();
      
      // Phase 7: Create checkpoints
      await this.createCheckpointObjects();
      this.completePhase();
      
      // Phase 8: Compile shaders
      await this.compileShaders();
      this.completePhase();
      
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
        resourceManager: this
      };
      
      // Mark loading as complete (100%)
      this.completeAllPhases();
      
      // Trigger callbacks
      if (this.onResourcesReady) {
        this.onResourcesReady(resources);
      }
      
      if (this.onComplete) {
        this.onComplete();
      }
      
      return resources;
    } catch (error) {
      console.error('Resource initialization failed:', error);
      
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

  /**
   * PHASE 1: Create and configure both renderers
   * WebGL renderer handles 3D objects, CSS3D handles HTML elements in 3D space
   * Performance optimized with capped pixel ratio for high-DPI displays
   */
  async createRenderers(container) {
    return new Promise((resolve, reject) => {
      try {
        // WebGL renderer for stars, road, and 3D geometry
        this.renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false, // Better memory management
          failIfMajorPerformanceCaveat: false // Don't fail on slower devices
        });
        
        // Cap pixel ratio to prevent GPU overload on high-DPI displays
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.zIndex = '1';
        
        // Performance optimizations
        this.renderer.shadowMap.enabled = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Initialize PMREMGenerator for environment mapping (safe initialization)
        try {
          this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          this.pmremGenerator.compileEquirectangularShader();
        } catch (error) {
          console.warn('PMREMGenerator initialization failed:', error);
          this.pmremGenerator = null; // Set to null on failure
        }
        
        // Add context lost/restore handlers with fallback UI
        const canvas = this.renderer.domElement;
        canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          console.warn('WebGL context lost. Attempting to restore...');
          
          // Show fallback UI with a new canvas overlay
          if (this.onError) {
            this.onError('WebGL context lost. Please refresh the page.');
          }
          
          // Create a new 2D canvas overlay for fallback message (don't reuse WebGL canvas)
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
          
          // Add to document body
          if (canvas.parentElement) {
            canvas.parentElement.appendChild(fallbackCanvas);
          }
        }, false);
        
        canvas.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored successfully');
          // Optionally reload resources here
          if (this.onError) {
            this.onError(null); // Clear error state
          }
        }, false);

        // CSS3D renderer for checkpoint cards and headers
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

  /**
   * PHASE 2: Create main 3D scene and CSS3D scene with environmental settings
   */
  async createScene() {
    return new Promise((resolve) => {
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
   * PHASE 4: Create HDRI environment for realistic lighting and crisp backgrounds
   * 
   * PERFORMANCE BENEFIT:
   * - Uses original HDRI for crisp scene.background
   * - Uses PMREM cubemap for realistic scene.environment lighting
   * - Fallback to procedural starfield ensures compatibility
   */
  async createEnvironment() {
    return new Promise((resolve) => {
      this.updateProgress(0.01);
      
      const createProceduralEnvironment = () => {
        this.updateProgress(0.8);
        
        // Simple gradient background as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create gradient from dark blue to purple
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
      
      // Configure texture loader for optimal mobile performance
      // RGBELoader automatically handles:
      // - RGBA format conversion (FloatType → UnsignedByteType on mobile)
      // - sRGB color space management
      // - HDR tone mapping for standard displays
      
      rgbeLoader.load(
        'space_environment.hdr',
        (hdrTexture) => {
          this.updateProgress(0.5);
          
          // RGBELoader handles texture format automatically
          // Texture is already in correct format (RGBA, UnsignedByteType for mobile)
          hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
          hdrTexture.colorSpace = THREE.SRGBColorSpace;
          
          // Use original texture for crisp background
          this.scene.background = hdrTexture;
          
          this.updateProgress(0.8);
          
          // Generate PMREM cubemap for lighting (check if pmremGenerator is defined)
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
          // HDRI loading progress
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

  /**
   * PHASE 5: Create optimized starfield using InstancedMesh
   * 
   * PERFORMANCE OPTIMIZATION:
   * Before: 6000+ individual THREE.Mesh objects = 6000+ draw calls
   * After: 1 THREE.InstancedMesh = 1 draw call
   * 
   * This single change can improve framerate by 10-50x on lower-end devices
   */
  async createStarfieldInstancedMesh() {
    return new Promise((resolve) => {
      this.updateProgress(0);
        
      // Calculate star count based on journey length (reduced for performance)
      const starCount = Math.max(STAR_FIELD_MAX_INITIAL_STARS * 0.7, this.journeyLength * STAR_DENSITY_PER_CHECKPOINT * 0.8);
      
      this.updateProgress(0.1);
      
      // Use low-poly geometry for better performance
      const starGeometry = new THREE.SphereGeometry(1, 6, 6);
      const starMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0.8,
        depthWrite: false // Performance optimization for transparent objects
      });
      
      this.updateProgress(0.2);
      
      // InstancedMesh: One mesh, thousands of instances
      this.starfieldMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
      
      const dummy = new THREE.Object3D();
      
      this.updateProgress(0.3);
      
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
        
        // Update progress during generation
        if (i % 5000 === 0) {
          const starProgress = i / starCount;
          this.updateProgress(0.3 + starProgress * 0.6);
        }
      }
      
      this.updateProgress(0.9);
      
      // Upload to GPU
      this.starfieldMesh.instanceMatrix.needsUpdate = true;
      this.starfieldMesh.instanceColor.needsUpdate = true;
      
      this.scene.add(this.starfieldMesh);
      
      this.updateProgress(1.0);
      resolve();
    });
  }

  /**
   * PHASE 6: Generate complex road curve using mathematical functions
   * Creates smooth, interesting path through 3D space with computed Frenet frames
   */
  async createRoadGeometry() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      // Reduce road complexity by 50% for better performance
      const roadPoints = Math.max(600, this.journeyLength * ROAD_POINTS_PER_CHECKPOINT * 0.5);
      const points = [];
      
      this.updateProgress(0.1);
      
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
        
        // Update progress during point generation
        if (i % 100 === 0) {
          const pointProgress = i / roadPoints;
          this.updateProgress(0.1 + pointProgress * 0.4);
        }
      }
      
      this.updateProgress(0.5);
      
      // Create smooth spline curve and compute Frenet frames for camera orientation
      this.roadCurve = new THREE.CatmullRomCurve3(points);
      this.updateProgress(0.7);
      
      this.frenetFrames = this.roadCurve.computeFrenetFrames(roadPoints + 500, false);
      this.updateProgress(0.8);

      // Create visible road line
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

  /**
   * PHASE 7: Create CSS3D checkpoint objects with React roots
   * SINGLE CREATION: Elements created once, stored in checkpoints array
   * CSS CUSTOM PROPERTIES: --offscreen-x set for slide-in direction
   * NO DOM ATTACHMENT: Deferred to Journey3D initialization
   * GUARD: Prevent duplicate creation if checkpoints already exist
   */
  async createCheckpointObjects() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      // Guard: Prevent duplicate checkpoint creation
      if (this.checkpoints.length > 0) {
        this.updateProgress(1.0);
        resolve();
        return;
      }
        
      this.updateProgress(0.1);
        
        journeyData.forEach((data, i) => {
          // Positioning: Compute exactly once
          const stopT = (i + 1) / (this.journeyLength + 1);
          const objectT = stopT + OBJECT_PLACEMENT_OFFSET_T;
          
          const position = this.roadCurve.getPointAt(objectT);
          const frameIndex = Math.floor(objectT * (this.frenetFrames.binormals.length - 1));
          const binormal = this.frenetFrames.binormals[frameIndex];

          // Alternating sides: Even = right (1), Odd = left (-1)
          const side = i % 2 === 0 ? 1 : -1;
          
          // World-space offsets: Compute using binormal
          const cardOffsetDistance = LATERAL_OFFSET_DISTANCE_CARD * SCENE_SCALE;
          const headerOffsetDistance = LATERAL_OFFSET_DISTANCE_HEADER * SCENE_SCALE;
          
          const cardOffset = binormal.clone().multiplyScalar(cardOffsetDistance * side);
          const headerOffset = binormal.clone().multiplyScalar(headerOffsetDistance * -side);

          // Card element: Create with CSS custom property
          const cardElement = document.createElement('div');
          cardElement.className = 'journey-card';
          
          // Set CSS custom property for slide-in direction
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
          
          // Header element: Create with opposite slide direction
          const headerElement = document.createElement('div');
          headerElement.className = 'journey-header-overlay';
          
          // Header slides from opposite side of card
          const headerOffscreenX = side > 0 ? '-150px' : '150px';
          headerElement.style.setProperty('--offscreen-x', headerOffscreenX);

          // CSS3D objects: Position and scale in 3D space
          const cardObject = new CSS3DObject(cardElement);
          cardObject.position.copy(position).add(cardOffset);
          cardObject.scale.set(1.5, 1.5, 1); // 150% size for prominence
          
          const headerObject = new CSS3DObject(headerElement);
          headerObject.position.copy(position).add(headerOffset);
          headerObject.scale.set(1.3, 1.3, 1); // 130% size for balance
          
          // Add to CSS3D scene
          this.cssScene.add(cardObject);
          this.cssScene.add(headerObject);

          // React root: Create for dynamic content rendering
          const root = createRoot(headerElement);

          // Store: Single creation, stored in checkpoints array
          this.checkpoints.push({ 
            stopT, 
            cardObject, 
            headerObject, 
            data, 
            triggered: false,
            root,
            index: i
          });
          
          // Update progress for each checkpoint created
          const checkpointProgress = (i + 1) / journeyData.length;
          this.updateProgress(0.1 + checkpointProgress * 0.8);
        });
        
        this.updateProgress(1.0);
        resolve();
    });
  }

  /**
   * PHASE 8: Pre-compile all shaders on GPU
   * Eliminates runtime shader compilation stutters that cause frame drops
   * All materials are compiled and cached on GPU during loading
   */
  async compileShaders() {
    return new Promise((resolve) => {
      this.updateProgress(0);
      
      // Simulate compilation progress
      setTimeout(() => {
        this.updateProgress(0.3);
    
        // Force compilation of all scene materials/shaders
        this.renderer.compile(this.scene, this.camera);
        this.updateProgress(0.7);
        
        this.isCompiled = true;
        
        this.updateProgress(1.0);
        resolve();
      }, 100); // Small delay to show progress
    });
  }

  /**
   * Cleanup THREE.js resources only (called from Loader cleanup)
   * Does NOT dispose React roots - that's handled by Journey3D
   */
  disposeThreeJSResources() {
    try {
      // Check WebGL context
      if (this.renderer && this.renderer.getContext()) {
        const gl = this.renderer.getContext();
        if (gl.isContextLost && gl.isContextLost()) {
          return;
        }
      }
    
      // THREE.js resources: Dispose geometries and materials
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
      
      // Environment resources: Dispose HDRI
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
      // Continue cleanup even if some resources fail to dispose
    }
  }

  /**
   * Dispose React roots only (called from Journey3D cleanup)
   * Lazy cleanup to allow quick re-entry without thrashing
   */
  disposeReactRoots() {
    // React roots: Lazy cleanup allows quick re-entry without thrashing
    this.checkpoints.forEach((cp, index) => {
      if (cp.root) {
        // Delay cleanup to allow potential re-entry
        setTimeout(() => {
          try {
            cp.root.unmount();
          } catch (error) {
            console.warn(`Error unmounting React root for checkpoint ${index}:`, error);
          }
        }, 1000); // 1 second delay instead of immediate
      }
    });
  }

  /**
   * Legacy method - prefer disposeThreeJSResources() or disposeReactRoots()
   */
  dispose() {
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
  const [targetProgress, setTargetProgress] = useState(0); // NEW: Target progress for smooth animation
  const [showContent, setShowContent] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [textAnimationsComplete, setTextAnimationsComplete] = useState({
    localTime: false,
    portfolio: false,
    since: false,
    welcome1: false,
    welcome2: false
  });
  
  // ── NEW: UI Loading State Management ──
  const [uiLoadingComplete, setUILoadingComplete] = useState(false);
  const [uiLoadingSteps, setUILoadingSteps] = useState({
    background: false,
    beams: false,
    circularProgress: false,
    textElements: false
    // Removed allAnimationsComplete - it's redundant with textElements
  });
  
  // ── Component References ──
  const containerRef = useRef(null);
  const resourceManagerRef = useRef(null);
  const hasInitializedRef = useRef(false); // Prevent duplicate initialization
  const progressAnimationRef = useRef(null); // For smooth progress animation

  // ── Smooth Progress Animation System ──
  const MAX_PROGRESS_SPEED = 1.5; // Smooth constant speed progression
  
  useEffect(() => {
    const animateProgress = () => {
      setProgress(currentProgress => {
        const difference = targetProgress - currentProgress;
        
        // If we're very close, snap to target
        if (Math.abs(difference) < 0.05) {
          return targetProgress;
        }
        
        // Smooth constant-speed interpolation
        const step = Math.sign(difference) * Math.min(Math.abs(difference), MAX_PROGRESS_SPEED);
        const newProgress = currentProgress + step;
        
        // Ensure we never exceed targetProgress
        const finalProgress = Math.min(newProgress, targetProgress);
        
        // Continue animation if we haven't reached target (using current value)
        if (Math.abs(targetProgress - finalProgress) > 0.05) {
        progressAnimationRef.current = requestAnimationFrame(animateProgress);
      }
        
        return finalProgress;
      });
    };
    
    // Start animation when target changes (check against current target, not progress state)
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
    }
    
    progressAnimationRef.current = requestAnimationFrame(animateProgress);
    
    // Cleanup animation on unmount
    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
    };
      }, [targetProgress]);

  // Initialize UI animations
  useEffect(() => {
    setShowContent(true);
    
    // Mark background as loaded immediately
    setUILoadingSteps(prev => ({ ...prev, background: true }));
    
    // Simulate beams loading with small delay
    setTimeout(() => {
      setUILoadingSteps(prev => ({ ...prev, beams: true }));
    }, 100);
    
    // Mark circular progress as loaded after a brief delay
    setTimeout(() => {
      setUILoadingSteps(prev => ({ ...prev, circularProgress: true }));
    }, 200);
  }, []);

  // Track text animation completion
  const handleTextAnimationComplete = useCallback((textKey) => {
    // Guard: Prevent multiple calls for the same animation
    if (textAnimationsComplete[textKey]) {
      return; // Already completed, ignore duplicate calls
    }
    
    setTextAnimationsComplete(prev => {
      // Double check to prevent race conditions
      if (prev[textKey]) {
        return prev; // No change needed
      }
      
      return {
        ...prev,
        [textKey]: true
      };
    });
  }, [textAnimationsComplete]);

  // Check when all text animations are complete
  useEffect(() => {
    const allTextComplete = Object.values(textAnimationsComplete).every(Boolean);
    if (allTextComplete && !uiLoadingSteps.textElements) {
      setUILoadingSteps(prev => ({ ...prev, textElements: true }));
    }
  }, [textAnimationsComplete, uiLoadingSteps.textElements]);

  // Check when all text animations are complete (for start button)
  const allTextAnimationsComplete = Object.values(textAnimationsComplete).every(Boolean);

  // Check when all UI loading steps are complete
  useEffect(() => {
    const allUIStepsComplete = Object.values(uiLoadingSteps).every(Boolean);
    
    if (allUIStepsComplete && !uiLoadingComplete) {
      setUILoadingComplete(true);
    }
  }, [uiLoadingSteps, uiLoadingComplete]);

  // Show start button when both progress is 100% and text animations are complete
  useEffect(() => {
    if (progress >= 100 && allTextAnimationsComplete) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setShowStartButton(true);
      }, 800);
    }
  }, [progress, allTextAnimationsComplete]);

  // Resource initialization: Only starts AFTER UI is completely loaded
  useEffect(() => {
    // Guard: Don't start until UI is completely loaded
    if (!uiLoadingComplete || hasInitializedRef.current || !containerRef.current) {
      return;
    }
    
    let isMounted = true;
    
    const initializeResources = async () => {
      const resourceManager = new ThreeJSResourceManager();
      resourceManagerRef.current = resourceManager;
      
      // Configure progress callbacks for smooth UI updates
      resourceManager.setCallbacks(
        // Progress updates from actual resource creation
        (progressValue) => {
          if (isMounted) {
            setTargetProgress(progressValue);
          }
        },
        // Completion - all assets loaded
        () => {
          if (isMounted) {
            setTargetProgress(100);
          }
        },
        // Error handling with recovery
        (error) => {
          console.error('Asset loading error:', error);
          if (isMounted) {
            setTargetProgress(95); // Stick at 95% on error
          }
        },
        // Resources ready callback - always called
        (resources) => {
          if (isMounted && onResourcesReady) {
            onResourcesReady(resources);
          }
        }
      );
      
      try {
        // Preload wallpaper images in parallel with 3D asset loading
        preloadWallpapers();
        
        // Asset loading phase - everything built here
        await resourceManager.initializeResources(containerRef.current);
        
        // Only set flag after successful completion
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize assets:', error);
        // Don't set hasInitialized flag on error - allow retry
      }
    };
    
    initializeResources();
    
    // Cleanup on unmount - do not dispose React roots here
    return () => {
      isMounted = false;
      if (resourceManagerRef.current) {
        // Only dispose THREE.js resources, not React roots
        resourceManagerRef.current.disposeThreeJSResources();
      }
    };
  }, [uiLoadingComplete, onResourcesReady]);

  // Transition to Journey3D
  const handleStartClick = () => {
    if (onComplete) {
      onComplete();
    } else {
      console.warn('onComplete callback not provided');
    }
  };

  // Enhanced loading interface with Major Mono styling and animations
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] min-h-screen min-w-full bg-black overflow-hidden major-mono-display-regular"
    >
      {/* Subtle visionOS gradient background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(47, 184, 255, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(94, 23, 255, 0.06) 0%, transparent 60%)'
        }} />
      </div>

      {/* Main container with enhanced spacing */}
      <div className="relative w-full h-screen flex flex-col z-10 p-6 md:p-12">
        {/* Current time display - client-only to prevent hydration mismatch */}
        <ClientTime 
          onAnimationComplete={() => handleTextAnimationComplete('localTime')}
          showContent={showContent}
        />

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
          className="absolute right-4 top-8 md:right-12 md:top-1/2 md:-translate-y-1/2 text-right flex flex-col gap-3 group cursor-default"
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