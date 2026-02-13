import { useEffect } from 'react';
import * as THREE from 'three';
import DecryptedText from './DecryptedText';

/**
 * Journey3DGeometry
 * 
 * Mesh and geometry visualization for the journey scene
 * Responsibilities:
 * - Road curve mesh rendering
 * - Starfield mesh management
 * - Checkpoint card positioning
 * - Visual element updates based on camera position
 * - CSS3D element animations
 * 
 * ~350 LOC
 */
export default function Journey3DGeometry({
  preloadedResources,
  sceneRef,
  currentProgress,
  onCheckpointTriggered
}) {
  const CHECKPOINT_PAUSE_DURATION = 2000;

  useEffect(() => {
    if (!preloadedResources || !sceneRef?.current) {
      return;
    }

    const { scene, cssScene, checkpoints } = preloadedResources;

    if (!checkpoints || checkpoints.length === 0) {
      return;
    }

    // Monitor camera position to trigger checkpoints
    let lastCheckpointIndex = -1;
    let checkpointPauseStart = null;

    const checkCheckpoints = () => {
      if (!sceneRef.current) return;

      const cameraT = sceneRef.current.cameraT || 0;
      const proximityThreshold = 0.02;

      checkpoints.forEach((checkpoint, index) => {
        const distance = Math.abs(cameraT - checkpoint.stopT);

        // Trigger animation when camera approaches checkpoint
        if (distance < proximityThreshold && lastCheckpointIndex !== index && !checkpoint.triggered) {
          checkpoint.triggered = true;
          lastCheckpointIndex = index;
          checkpointPauseStart = Date.now();

          // Trigger slide-in animations
          try {
            if (checkpoint.cardObject?.element) {
              checkpoint.cardObject.element.classList.add('visible');
            }
            if (checkpoint.headerObject?.element) {
              checkpoint.headerObject.element.classList.add('visible');
            }

            // Render checkpoint header with animations
            if (checkpoint.root && checkpoint.data) {
              checkpoint.root.render(
                <CheckpointHeader 
                  title={checkpoint.data.title}
                  heading={checkpoint.data.heading}
                  onAnimationComplete={() => {
                    // Callback when animations complete
                    if (onCheckpointTriggered) {
                      onCheckpointTriggered(checkpoint, index);
                    }
                  }}
                />
              );
            }
          } catch (error) {
            console.error('Error triggering checkpoint:', error);
          }
        }

        // Add fade-in class for visibility
        if (distance < proximityThreshold) {
          if (checkpoint.cardObject?.element) {
            checkpoint.cardObject.element.style.opacity = '1';
          }
          if (checkpoint.headerObject?.element) {
            checkpoint.headerObject.element.style.opacity = '1';
          }
        } else {
          if (checkpoint.cardObject?.element) {
            checkpoint.cardObject.element.style.opacity = '0.5';
          }
          if (checkpoint.headerObject?.element) {
            checkpoint.headerObject.element.style.opacity = '0.5';
          }
        }
      });
    };

    const intervalId = setInterval(checkCheckpoints, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [preloadedResources, sceneRef, onCheckpointTriggered]);

  // Update checkpoint visibility based on camera position
  useEffect(() => {
    if (!preloadedResources || !sceneRef?.current) {
      return;
    }

    const { checkpoints } = preloadedResources;
    if (!checkpoints) return;

    const updateCheckpointVisibility = () => {
      const cameraT = sceneRef.current?.cameraT || 0;

      checkpoints.forEach((checkpoint) => {
        // Calculate distance from camera
        const distance = Math.abs(cameraT - checkpoint.stopT);
        const maxVisibleDistance = 0.15;

        // Fade in/out based on distance
        const visibility = Math.max(0, 1 - distance / maxVisibleDistance);

        if (checkpoint.cardObject?.element) {
          checkpoint.cardObject.element.style.opacity = String(0.3 + visibility * 0.7);
        }
        if (checkpoint.headerObject?.element) {
          checkpoint.headerObject.element.style.opacity = String(0.3 + visibility * 0.7);
        }
      });
    };

    const intervalId = setInterval(updateCheckpointVisibility, 50);

    return () => {
      clearInterval(intervalId);
    };
  }, [preloadedResources, sceneRef]);

  return null; // This component manages scene geometry, no DOM needed
}

// Checkpoint header component for rendering titles
const CheckpointHeader = ({ title, heading, onAnimationComplete }) => {
  useEffect(() => {
    // Simulate animation completion
    const timer = setTimeout(onAnimationComplete, 2000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <>
      <div className="journey-title-container">
        <DecryptedText
          text={title}
          speed={40}
          maxIterations={15}
          sequential={true}
          revealDirection="center"
          className="journey-title decrypted-text"
          encryptedClassName="journey-title encrypted-text text-white/30"
          animateOn="view"
          onAnimationComplete={() => {}}
        />
      </div>
      <div className="journey-heading-container">
        <DecryptedText
          text={heading}
          speed={50}
          maxIterations={12}
          sequential={true}
          revealDirection="start"
          className="journey-heading decrypted-text"
          encryptedClassName="journey-heading encrypted-text text-white/30"
          animateOn="view"
          onAnimationComplete={() => {}}
        />
      </div>
    </>
  );
};
