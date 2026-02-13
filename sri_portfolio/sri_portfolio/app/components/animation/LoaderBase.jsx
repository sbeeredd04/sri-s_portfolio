import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import DecryptedText from './DecryptedText';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RGBELoader } from 'three-stdlib';
import { createRoot } from 'react-dom/client';
import journeyData from '../../json/journey.json';

/**
 * LoaderBase Component
 * Core animation logic and THREE.js setup
 * Extracted from Loader.jsx for better maintainability
 */

// SCENE CONSTANTS - Must match Journey3D constants exactly
export const SCENE_SCALE = 5;
export const STAR_DENSITY_PER_CHECKPOINT = 8000;
export const STAR_FIELD_MAX_INITIAL_STARS = 6000;
export const STAR_COLOR_MIN_INTENSITY = 0.7;
export const STAR_COLOR_MAX_INTENSITY = 1.0;
export const ROAD_POINTS_PER_CHECKPOINT = 200;
export const ROAD_CURVE_LENGTH_MULTIPLIER = 2;
export const ROAD_X_AMPLITUDE_1 = 150;
export const ROAD_X_FREQUENCY_1 = 0.3;
export const ROAD_X_AMPLITUDE_2 = 50;
export const ROAD_X_FREQUENCY_2 = 0.15;
export const ROAD_Y_AMPLITUDE_1 = 40;
export const ROAD_Y_FREQUENCY_1 = 0.4;
export const ROAD_Y_AMPLITUDE_2 = 20;
export const ROAD_Y_FREQUENCY_2 = 0.8;
export const ROAD_Z_SPACING = 6.0;
export const OBJECT_PLACEMENT_OFFSET_T = 0.08;

// Helper function to generate star field
export function generateStarField(checkpoints) {
  const stars = [];
  const starsPerCheckpoint = Math.floor(STAR_DENSITY_PER_CHECKPOINT / checkpoints.length);
  
  for (let i = 0; i < STAR_FIELD_MAX_INITIAL_STARS; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      z: (Math.random() - 0.5) * 2000,
      intensity: STAR_COLOR_MIN_INTENSITY + Math.random() * (STAR_COLOR_MAX_INTENSITY - STAR_COLOR_MIN_INTENSITY),
    });
  }
  
  return stars;
}

// Helper function to generate road path
export function generateRoadPath(checkpoints) {
  const points = [];
  
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const current = new THREE.Vector3(checkpoints[i].x, checkpoints[i].y, checkpoints[i].z);
    const next = new THREE.Vector3(checkpoints[i + 1].x, checkpoints[i + 1].y, checkpoints[i + 1].z);
    
    for (let j = 0; j < ROAD_POINTS_PER_CHECKPOINT; j++) {
      const t = j / ROAD_POINTS_PER_CHECKPOINT;
      
      // Apply wave patterns
      const xWave = Math.sin(i + t * ROAD_CURVE_LENGTH_MULTIPLIER) * ROAD_X_AMPLITUDE_1 * Math.sin(t * Math.PI * ROAD_X_FREQUENCY_1)
                  + Math.sin(i * 0.5 + t) * ROAD_X_AMPLITUDE_2 * Math.sin(t * Math.PI * ROAD_X_FREQUENCY_2);
      const yWave = Math.sin(i * 0.3 + t) * ROAD_Y_AMPLITUDE_1 * Math.sin(t * Math.PI * ROAD_Y_FREQUENCY_1)
                  + Math.cos(i + t * 0.5) * ROAD_Y_AMPLITUDE_2 * Math.sin(t * Math.PI * ROAD_Y_FREQUENCY_2);
      
      const point = new THREE.Vector3().lerpVectors(current, next, t);
      point.x += xWave;
      point.y += yWave;
      point.z = i * ROAD_Z_SPACING + t * ROAD_Z_SPACING;
      
      points.push(point);
    }
  }
  
  return points;
}

// Helper function to create THREE scene
export function createThreeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.0008);
  
  return scene;
}

// Helper function to create camera
export function createCamera(containerWidth, containerHeight) {
  const camera = new THREE.PerspectiveCamera(
    75,
    containerWidth / containerHeight,
    0.1,
    10000
  );
  camera.position.set(0, 100, 100);
  camera.lookAt(0, 0, 100);
  
  return camera;
}

// Helper function to create renderer
export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  container.appendChild(renderer.domElement);
  
  return renderer;
}

export default function LoaderBase({ onSceneReady, onAnimationComplete }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene components
    const scene = createThreeScene();
    const camera = createCamera(containerRef.current.clientWidth, containerRef.current.clientHeight);
    const renderer = createRenderer(containerRef.current);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Generate scene elements
    const stars = generateStarField(journeyData.checkpoints);
    const roadPath = generateRoadPath(journeyData.checkpoints);

    // Notify parent that scene is ready
    if (onSceneReady) {
      onSceneReady({ scene, camera, renderer, stars, roadPath });
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSceneReady, onAnimationComplete]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
