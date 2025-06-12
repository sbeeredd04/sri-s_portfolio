"use client";
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import journeyData from '../../json/journey.json';

export default function Journey3D({ onComplete }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const sceneRef = useRef(null);

  // Calculate dynamic values based on journey data length
  const journeyLength = journeyData.length;
  const totalHeight = Math.max(1600, journeyLength * 300); // Scale height based on data length

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.height = `${totalHeight}vh`;
      document.body.style.overflow = 'auto';
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [totalHeight]);

  useEffect(() => {
    if (isTransitioning) return;

    let scene, camera, renderer, cssRenderer, cssScene;
    let roadCurve, frenetFrames;
    let checkpoints = [];
    let isPausedAtCheckpoint = false;
    let targetT = 0;
    let cameraT = 0;
    const LERP_FACTOR = 0.02; // Smoother scrolling
    const SCENE_SCALE = 6;

    function initThreeJS() {
      const container = containerRef.current;
      if (!container || typeof THREE === 'undefined') return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 200 * SCENE_SCALE, 1000 * SCENE_SCALE);

      cssScene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000 * SCENE_SCALE);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.zIndex = '1';
        container.appendChild(renderer.domElement);
      } catch (error) {
        return;
      }

      try {
        if (typeof THREE.CSS3DRenderer === 'undefined') return;
        cssRenderer = new THREE.CSS3DRenderer();
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.domElement.style.position = 'absolute';
        cssRenderer.domElement.style.top = 0;
        cssRenderer.domElement.style.zIndex = '2';
        container.appendChild(cssRenderer.domElement);
      } catch (error) {
        return;
      }

      createStarfield();
      createRollerCoasterRoad();
      createCheckpointObjects();
      setupScrollControls();
      
      sceneRef.current = {
        scene, camera, renderer, cssRenderer, cssScene,
        roadCurve, frenetFrames, checkpoints,
        isPausedAtCheckpoint, targetT, cameraT,
        LERP_FACTOR, SCENE_SCALE
      };

      setIsLoaded(true);
      animate();
    }

    function createStarfield() {
      // Scale star count based on journey length
      const starCount = Math.max(6000, journeyLength * 1000);
      const starVertices = [];
      for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const y = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const z = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        starVertices.push(x, y, z);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 1.2 * SCENE_SCALE, 
        transparent: true, 
        opacity: 0.9 
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    }

    function createRollerCoasterRoad() {
      // Scale road length based on journey data
      const roadPoints = Math.max(1200, journeyLength * 200);
      const points = [];
      for (let i = 0; i <= roadPoints; i++) {
        const t = (i / roadPoints) * Math.PI * (journeyLength + 2);
        const x = Math.sin(t * 0.3) * 150 + Math.cos(t * 0.15) * 50;
        const y = Math.cos(t * 0.4) * 40 + Math.sin(t * 0.8) * 20;
        const z = i * 5.0 - (roadPoints * 2);
        points.push(new THREE.Vector3(x, y, z).multiplyScalar(SCENE_SCALE));
      }
      
      roadCurve = new THREE.CatmullRomCurve3(points);
      frenetFrames = roadCurve.computeFrenetFrames(roadPoints + 500, false);

      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
      const linePoints = roadCurve.getPoints(roadPoints + 500);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const centerLine = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(centerLine);
    }

    function createCheckpointObjects() {
      journeyData.forEach((data, i) => {
        const stopT = (i + 1) / (journeyLength + 1);
        const objectT = stopT + 0.05;
        
        const position = roadCurve.getPointAt(objectT);
        const frameIndex = Math.floor(objectT * (frenetFrames.binormals.length - 1));
        const binormal = frenetFrames.binormals[frameIndex];

        const cardElement = document.createElement('div');
        cardElement.className = 'journey-card';
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
        
        const cardObject = new THREE.CSS3DObject(cardElement);
        const cardSide = i % 2 === 0 ? 1 : -1;
        const cardOffset = binormal.clone().multiplyScalar(250 * SCENE_SCALE * cardSide);
        cardObject.position.copy(position).add(cardOffset);

        const headerElement = document.createElement('div');
        headerElement.className = 'journey-header-overlay';
        headerElement.innerHTML = `
          <h1 class="journey-title">${data.title}</h1>
          <h2 class="journey-heading">${data.heading}</h2>
        `;
        
        const headerObject = new THREE.CSS3DObject(headerElement);
        const headerOffset = binormal.clone().multiplyScalar(250 * SCENE_SCALE * -cardSide);
        headerObject.position.copy(position).add(headerOffset);
        
        cssScene.add(cardObject);
        cssScene.add(headerObject);
        checkpoints.push({ stopT, cardObject, headerObject, data, triggered: false });
      });
    }

    function setupScrollControls() {
      const handleScroll = () => {
        if (isPausedAtCheckpoint) return;
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        targetT = scrollTop / docHeight;
        const newProgress = Math.round(targetT * 100);
        
        setProgress(newProgress);

        if (targetT >= 0.95) {
          setIsCompleting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 2000);
        }
      };
      
      // Throttle scroll events for better performance
      let ticking = false;
      const throttledScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', throttledScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', throttledScroll);
      };
    }

    function updateCameraAndObjects() {
      // Smooth camera movement with dynamic deceleration
      const checkpointPositions = checkpoints.map(cp => cp.stopT);
      let dynamicLerpFactor = LERP_FACTOR;
      
      // Decelerate near checkpoints
      for (let checkpointT of checkpointPositions) {
        const distance = Math.abs(targetT - checkpointT);
        if (distance < 0.03) {
          dynamicLerpFactor = LERP_FACTOR * 0.4;
          break;
        } else if (distance < 0.06) {
          dynamicLerpFactor = LERP_FACTOR * 0.7;
          break;
        }
      }
      
      cameraT += (targetT - cameraT) * dynamicLerpFactor;
      cameraT = Math.min(Math.max(cameraT, 0), 0.999);

      const position = roadCurve.getPointAt(cameraT);
      const frameIndex = Math.floor(cameraT * frenetFrames.tangents.length);
      const normal = frenetFrames.normals[frameIndex];
      
      camera.position.copy(position).add(normal.clone().multiplyScalar(5.0 * SCENE_SCALE));

      const lookAtPosition = roadCurve.getPointAt(Math.min(cameraT + 0.01, 1));
      const matrix = new THREE.Matrix4();
      matrix.lookAt(camera.position, lookAtPosition, normal);
      camera.quaternion.setFromRotationMatrix(matrix);

      checkpoints.forEach((cp, index) => {
        cp.cardObject.rotation.copy(camera.rotation);
        cp.headerObject.rotation.copy(camera.rotation);

        if (!cp.triggered && cameraT >= cp.stopT) {
          cp.triggered = true;
          setCurrentCheckpoint(index);
          playCheckpointSequence(cp);
        }
      });
    }

    async function playCheckpointSequence(cp) {
      isPausedAtCheckpoint = true;
      
      const cardAnimationPromise = new Promise(resolve => {
        cp.cardObject.element.classList.add('visible');
        setTimeout(resolve, 800);
      });

      const headerAnimationPromise = new Promise(resolve => {
        cp.headerObject.element.classList.add('visible');
        setTimeout(resolve, 1000);
      });
      
      await Promise.all([cardAnimationPromise, headerAnimationPromise]);

      setTimeout(() => {
        isPausedAtCheckpoint = false;
      }, 1500);
    }

    function animate() {
      requestAnimationFrame(animate);
      updateCameraAndObjects();
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (typeof window !== 'undefined') {
      if (typeof THREE !== 'undefined') {
        if (typeof THREE.CSS3DRenderer !== 'undefined') {
          initThreeJS();
        } else {
          const cssScript = document.createElement('script');
          cssScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS3DRenderer.js';
          cssScript.onload = () => initThreeJS();
          document.head.appendChild(cssScript);
        }
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => {
          const cssScript = document.createElement('script');
          cssScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS3DRenderer.js';
          cssScript.onload = () => initThreeJS();
          document.head.appendChild(cssScript);
        };
        document.head.appendChild(script);
      }
      
      window.addEventListener('resize', onWindowResize);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.height = '';
        document.body.style.overflow = '';
      }
      
      if (sceneRef.current) {
        const { renderer, cssRenderer } = sceneRef.current;
        if (renderer) renderer.dispose();
        if (cssRenderer && cssRenderer.domElement) cssRenderer.domElement.remove();
      }
      window.removeEventListener('resize', onWindowResize);
    };
  }, [isTransitioning, journeyLength, totalHeight]);

  return (
    <div className="fixed inset-0 bg-black major-mono-display-regular overflow-hidden">
      {/* Transition overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Completion fade overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Welcome message during transition */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <DecryptedText
                text="Welcome to My Journey"
                speed={40}
                maxIterations={15}
                sequential={true}
                revealDirection="center"
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 major-mono-display-regular"
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <DecryptedText
                text="Scroll to explore my story"
                speed={50}
                maxIterations={12}
                sequential={true}
                revealDirection="start"
                className="text-base md:text-lg lg:text-xl text-white/70 major-mono-display-regular"
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Three.js Container */}
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Minimal UI Overlay - Only Progress */}
      {!isTransitioning && !isCompleting && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Progress Bar */}
          <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-black/40 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 pointer-events-auto">
            <DecryptedText
              text="Journey Progress"
              speed={30}
              maxIterations={8}
              sequential={true}
              className="text-white text-xs md:text-sm mb-2 major-mono-display-regular"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <div className="w-24 md:w-32 h-1 md:h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-white/70 text-xs mt-1 major-mono-display-regular">{progress}%</div>
          </div>

          {/* Simple scroll instruction */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-xl px-4 md:px-6 py-2 md:py-3 border border-white/10 text-center pointer-events-auto">
            <DecryptedText
              text="Scroll to continue"
              speed={40}
              maxIterations={10}
              sequential={true}
              className="text-white text-xs md:text-sm major-mono-display-regular"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <div className="text-white/60 text-xs mt-1 major-mono-display-regular">
              {currentCheckpoint + 1} of {journeyLength}
            </div>
          </div>
        </motion.div>
      )}

      {/* CSS Styles for 3D Objects */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
        
        .major-mono-display-regular {
          font-family: 'Major Mono Display', monospace;
          font-weight: 400;
          font-style: normal;
        }

        .journey-card {
          width: 100vw;
          max-width: 1400px;
          opacity: 0;
          transform: scale(0.9) translateY(30px);
          transition: opacity 2s cubic-bezier(0.23, 1, 0.32, 1), transform 2s cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
        }

        .journey-card.visible {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .journey-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 60px;
          padding: 20px;
        }

        .journey-image-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .journey-image {
          width: min(90vw, 1000px);
          height: min(60vw, 650px);
          object-fit: cover;
          border-radius: 24px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.1);
          transition: transform 0.3s ease;
        }

        .journey-image:hover {
          transform: scale(1.02);
        }

        .journey-text-content {
          width: min(90vw, 1100px);
          color: white;
          text-align: center;
        }

        .journey-description {
          font-size: clamp(18px, 3vw, 32px);
          line-height: 1.8;
          margin: 0;
          color: #ddd;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: min(85vw, 1000px);
          margin: 0 auto;
        }

        .journey-header-overlay {
          width: 100vw;
          max-width: 1400px;
          color: #fff;
          font-family: 'Major Mono Display', monospace;
          text-align: center;
          opacity: 0;
          transition: opacity 1.5s cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
          padding: 20px;
        }

        .journey-header-overlay.visible {
          opacity: 1;
        }

        .journey-title {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(48px, 8vw, 120px);
          margin: 0 0 20px 0;
          color: white;
          font-weight: bold;
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.4);
          letter-spacing: clamp(2px, 1vw, 8px);
        }

        .journey-heading {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(20px, 4vw, 48px);
          margin: 0;
          color: #ccc;
          font-weight: 400;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          letter-spacing: clamp(1px, 0.5vw, 4px);
        }

        @media (max-width: 768px) {
          .journey-content {
            gap: 40px;
            padding: 15px;
          }
          
          .journey-image {
            border-radius: 16px;
          }
          
          .journey-header-overlay {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
} 