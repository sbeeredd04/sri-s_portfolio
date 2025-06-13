"use client";
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import journeyData from '../../json/journey.json';

// Helper component for checkpoint headers
const CheckpointHeader = ({ title, heading, onAnimationComplete }) => {
  const [titleDone, setTitleDone] = useState(false);
  const [headingDone, setHeadingDone] = useState(false);

  useEffect(() => {
    if (titleDone && headingDone) {
      onAnimationComplete();
    }
  }, [titleDone, headingDone, onAnimationComplete]);

  return (
    <>
      <div className="journey-title-container">
        <DecryptedText
            text={title}
            speed={40}
            maxIterations={15}
            sequential={true}
            revealDirection="center"
            className="journey-title"
            encryptedClassName="text-white/30"
            animateOn="view"
            onAnimationComplete={() => setTitleDone(true)}
        />
      </div>
      <div className="journey-heading-container">
        <DecryptedText
            text={heading}
            speed={50}
            maxIterations={12}
            sequential={true}
            revealDirection="start"
            className="journey-heading"
            encryptedClassName="text-white/30"
            animateOn="view"
            onAnimationComplete={() => setHeadingDone(true)}
        />
      </div>
    </>
  );
};

export default function Journey3D({ onComplete }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const sceneRef = useRef(null);
  const rootsRef = useRef([]);

  const journeyLength = journeyData.length;
  const totalHeight = Math.max(1600, journeyLength * 300);

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
    const LERP_FACTOR = 0.05; // Increased from 0.02 for smoother movement like the example
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
      const starCount = Math.max(6000, journeyLength * 1000);
      const starGroup = new THREE.Group();
      const starGeometry = new THREE.SphereGeometry(1, 8, 8); 
      
      for (let i = 0; i < starCount; i++) {
        const starMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            transparent: true, 
            opacity: 0.8
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);

        const x = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const y = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const z = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        star.position.set(x,y,z);

        const scale = THREE.MathUtils.randFloat(0.5, 2.5) * SCENE_SCALE * 0.2;
        star.scale.set(scale, scale, scale);
        
        starGroup.add(star);
      }
      scene.add(starGroup);
    }

    function createRollerCoasterRoad() {
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
        const objectT = stopT + 0.065; // Increased offset like in the example
        
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
        
        const headerObject = new THREE.CSS3DObject(headerElement);
        const headerOffset = binormal.clone().multiplyScalar(250 * SCENE_SCALE * -cardSide);
        headerObject.position.copy(position).add(headerOffset);
        
        cssScene.add(cardObject);
        cssScene.add(headerObject);
        
        const root = createRoot(headerElement);
        rootsRef.current.push(root);

        checkpoints.push({ stopT, cardObject, headerObject, data, triggered: false, root });
      });
    }

    function setupScrollControls() {
      const handleScroll = (event) => {
        const sRef = sceneRef.current;
        if (!sRef) return;
        
        // Completely ignore scroll events while paused (like the HTML example)
        if (sRef.isPausedAtCheckpoint) {
          event.preventDefault();
          return;
        }
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        sRef.targetT = scrollTop / docHeight;
        const newProgress = Math.round(sRef.targetT * 100);
        
        setProgress(newProgress);

        if (sRef.targetT >= 0.95 && !isCompleting) {
          setIsCompleting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 2000);
        }
      };
      
      // Use passive: false to allow preventDefault
      window.addEventListener('scroll', handleScroll, { passive: false });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    function updateCameraAndObjects() {
      const sRef = sceneRef.current;
      if (!sRef) return;
      
      // Only update camera position if not paused (like the HTML example)
      if (!sRef.isPausedAtCheckpoint) {
        sRef.cameraT += (sRef.targetT - sRef.cameraT) * LERP_FACTOR;
      }
      sRef.cameraT = Math.min(Math.max(sRef.cameraT, 0), 0.999);

      const position = sRef.roadCurve.getPointAt(sRef.cameraT);
      const frameIndex = Math.floor(sRef.cameraT * sRef.frenetFrames.tangents.length);
      const normal = sRef.frenetFrames.normals[frameIndex];
      
      sRef.camera.position.copy(position).add(normal.clone().multiplyScalar(5.0 * SCENE_SCALE));

      const lookAtPosition = sRef.roadCurve.getPointAt(Math.min(sRef.cameraT + 0.01, 1));
      const matrix = new THREE.Matrix4();
      matrix.lookAt(sRef.camera.position, lookAtPosition, normal);
      sRef.camera.quaternion.setFromRotationMatrix(matrix);

      sRef.checkpoints.forEach((cp, index) => {
        cp.cardObject.rotation.copy(sRef.camera.rotation);
        cp.headerObject.rotation.copy(sRef.camera.rotation);

        if (!cp.triggered && sRef.cameraT >= cp.stopT) {
          cp.triggered = true;
          setCurrentCheckpoint(index);
          playCheckpointSequence(cp);
        }
      });
    }

    async function playCheckpointSequence(cp) {
      if (!sceneRef.current) return;
      sceneRef.current.isPausedAtCheckpoint = true;
      
      // Show card and header elements
      cp.cardObject.element.classList.add('visible');
      cp.headerObject.element.classList.add('visible');

      // Promise-based animation tracking like the HTML example
      const cardAnimationPromise = new Promise(resolve => {
        cp.cardObject.element.addEventListener('transitionend', resolve, { once: true });
      });

      const typewriterPromise = new Promise((resolve) => {
        cp.root.render(
          <CheckpointHeader 
            title={cp.data.title}
            heading={cp.data.heading}
            onAnimationComplete={resolve}
          />
        );
      });
      
      // Wait for both animations to complete
      await Promise.all([cardAnimationPromise, typewriterPromise]);

      // Add a final delay before allowing scroll resume
      setTimeout(() => {
        // Set up one-time event listener to resume scrolling (like the HTML example)
        const resumeScroll = () => {
          if (sceneRef.current) {
            sceneRef.current.isPausedAtCheckpoint = false;
          }
          window.removeEventListener('scroll', resumeScroll);
        };
        window.addEventListener('scroll', resumeScroll, { passive: false });
      }, 1000);
    }

    function animate() {
      requestAnimationFrame(animate);
      updateCameraAndObjects();
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    }

    function onWindowResize() {
      if (!sceneRef.current) return;
      const { camera, renderer, cssRenderer } = sceneRef.current;
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
      
      rootsRef.current.forEach(root => root.unmount());
      rootsRef.current = [];

      if (sceneRef.current) {
        const { renderer, cssRenderer } = sceneRef.current;
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement) renderer.domElement.remove();
        }
        if (cssRenderer && cssRenderer.domElement) cssRenderer.domElement.remove();
      }
      window.removeEventListener('resize', onWindowResize);
    };
  }, [isTransitioning, journeyLength, totalHeight, onComplete, isCompleting]);

  return (
    <div className="fixed inset-0 bg-black major-mono-display-regular overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

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
      
      <div ref={containerRef} className="absolute inset-0" />
      
      {!isTransitioning && !isCompleting && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-black/40 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 pointer-events-auto flex items-center gap-4">
            <div>
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
            <button 
              onClick={onComplete}
              className="bg-white/10 text-white px-3 py-2 rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/20"
            >
              Skip
            </button>
          </div>

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

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
        
        .major-mono-display-regular {
          font-family: 'Major Mono Display', monospace;
          font-weight: 400;
          font-style: normal;
        }

        .journey-card {
          width: 100vw;
          max-width: 1600px;
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
          gap: 80px;
          padding: 30px;
        }

        .journey-image-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .journey-image {
          width: min(95vw, 1200px);
          height: min(65vw, 750px);
          object-fit: cover;
          border-radius: 24px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.1);
          transition: transform 0.3s ease;
        }

        .journey-image:hover {
          transform: scale(1.02);
        }

        .journey-text-content {
          width: min(95vw, 1400px);
          color: white;
          text-align: center;
        }

        .journey-description {
          font-size: clamp(24px, 4vw, 42px);
          line-height: 1.8;
          margin: 0;
          color: #ddd;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: min(90vw, 1300px);
          margin: 0 auto;
          font-weight: 400;
        }

        .journey-header-overlay {
          width: 100vw;
          max-width: 1600px;
          color: #fff;
          font-family: 'Major Mono Display', monospace;
          text-align: center;
          opacity: 0;
          transition: opacity 1.5s cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
          padding: 30px;
        }

        .journey-header-overlay.visible {
          opacity: 1;
        }
        
        .journey-title-container, .journey-heading-container {
          display: inline-block;
          width: 100%;
        }

        .journey-title {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(48px, 8vw, 120px);
          margin: 0 0 20px 0;
          color: white;
          font-weight: bold;
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.4);
          letter-spacing: clamp(2px, 1vw, 8px);
          display: inline-block;
        }

        .journey-heading {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(20px, 4vw, 48px);
          margin: 0;
          color: #ccc;
          font-weight: 400;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          letter-spacing: clamp(1px, 0.5vw, 4px);
          display: inline-block;
        }

        @media (max-width: 768px) {
          .journey-content {
            gap: 60px;
            padding: 20px;
          }
          
          .journey-image {
            border-radius: 16px;
          }
          
          .journey-header-overlay {
            padding: 20px;
          }
          
          .journey-description {
            font-size: clamp(20px, 5vw, 32px);
          }
        }
      `}</style>
    </div>
  );
} 