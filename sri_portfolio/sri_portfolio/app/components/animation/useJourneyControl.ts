import { useReducer, useRef, useEffect, useCallback } from 'react';
import { cameraReducer, initialCameraState, CameraState, CameraAction } from './cameraReducer';

// ──────────────────────────────────────────────────────────────────────────────
// JOURNEY CONTROL HOOK - FSM-based checkpoint management
// ──────────────────────────────────────────────────────────────────────────────

interface CheckpointData {
  stopT: number;
  index: number;
  triggered: boolean;
}

interface UseJourneyControlProps {
  checkpoints: CheckpointData[];
  autoResumeDelayMs?: number;
}

/**
 * Custom hook for managing journey FSM with checkpoints
 * 
 * RESPONSIBILITIES:
 * ├── Manage camera state machine (traveling/paused/resuming/completed)
 * ├── Detect scroll events and trigger USER_RESUME
 * ├── Handle auto-resume timeout fallback
 * ├── Check for checkpoint collisions in RAF loop
 * ├── Provide smooth catch-up logic during resume
 * └── Clean up timers and event listeners
 */
export function useJourneyControl({ 
  checkpoints, 
  autoResumeDelayMs = 5000 
}: UseJourneyControlProps) {
  const [state, dispatch] = useReducer(cameraReducer, initialCameraState);
  
  // ── Refs for performance and cleanup ──
  const latestScrollY = useRef(0);
  const autoResumeTimer = useRef<number | undefined>(undefined);
  const lastCheckpointIndex = useRef(-1);
  
  // ── SCROLL DETECTION: Removed - now handled by virtual scroll system in Journey3D ──
  // The virtual scroll system will dispatch USER_RESUME actions directly
  
  // ── Auto-Resume Timer: Fallback mechanism ──
  useEffect(() => {
    if (state.phase === 'atCheckpoint') {
      console.log(`⏰ Starting auto-resume timer for ${autoResumeDelayMs}ms`);
      
      autoResumeTimer.current = window.setTimeout(() => {
        console.log('⏰ Auto-resume timer fired');
        dispatch({ type: 'AUTO_RESUME' });
      }, autoResumeDelayMs);
    } else {
      // Clear timer when leaving atCheckpoint state
      if (autoResumeTimer.current) {
        window.clearTimeout(autoResumeTimer.current);
        autoResumeTimer.current = undefined;
        console.log('🧹 Auto-resume timer cleared');
      }
    }
    
    return () => {
      if (autoResumeTimer.current) {
        window.clearTimeout(autoResumeTimer.current);
      }
    };
  }, [state.phase, autoResumeDelayMs]);
  
  // ── Checkpoint Collision Detection ──
  const checkForCheckpointCollision = useCallback((cameraT: number) => {
    if (state.phase !== 'traveling') return;
    
    // Find the next untriggered checkpoint
    for (let i = lastCheckpointIndex.current + 1; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
      
      if (cameraT >= checkpoint.stopT && !checkpoint.triggered) {
        console.log(`🎯 Checkpoint ${i} collision detected at cameraT=${cameraT}, stopT=${checkpoint.stopT}`);
        
        // Mark as triggered to prevent re-triggering
        checkpoint.triggered = true;
        lastCheckpointIndex.current = i;
        
        dispatch({ type: 'REACH_CHECKPOINT', index: i });
        break;
      }
    }
  }, [state.phase, checkpoints]);
  
  // ── Journey Completion Detection ──
  const checkForJourneyCompletion = useCallback((cameraT: number) => {
    if (cameraT >= 0.95 && state.phase !== 'completed') {
      console.log('🏁 Journey completion detected at cameraT =', cameraT);
      dispatch({ type: 'JOURNEY_COMPLETE' });
    }
  }, [state.phase]);
  
  // ── Catch-up Progress Detection ──
  const checkForCatchUpComplete = useCallback((cameraT: number, targetT: number) => {
    if (state.phase === 'resuming') {
      const catchUpThreshold = 0.01; // 1% tolerance
      const isCaughtUp = Math.abs(cameraT - targetT) < catchUpThreshold;
      
      if (isCaughtUp) {
        console.log(`✅ Catch-up complete: cameraT=${cameraT}, targetT=${targetT}`);
        dispatch({ type: 'CATCH_UP_COMPLETE' });
      }
    }
  }, [state.phase]);
  
  // ── Main Update Function: Called from RAF loop ──
  const update = useCallback((deltaTime: number, cameraT: number, targetT: number) => {
    // 1. Check for checkpoint collisions (only when traveling)
    checkForCheckpointCollision(cameraT);
    
    // 2. Check for catch-up completion (only when resuming)
    checkForCatchUpComplete(cameraT, targetT);
    
    // 3. Check for journey completion
    checkForJourneyCompletion(cameraT);
  }, [checkForCheckpointCollision, checkForCatchUpComplete, checkForJourneyCompletion]);
  
  // ── Camera Movement Permission ──
  const shouldMoveCamera = useCallback(() => {
    return state.phase !== 'atCheckpoint';
  }, [state.phase]);
  
  // ── Reset Function: Clear triggered flags for restart ──
  const reset = useCallback(() => {
    console.log('🔄 Resetting journey control state');
    checkpoints.forEach(cp => cp.triggered = false);
    lastCheckpointIndex.current = -1;
    
    if (autoResumeTimer.current) {
      window.clearTimeout(autoResumeTimer.current);
      autoResumeTimer.current = undefined;
    }
  }, [checkpoints]);
  
  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (autoResumeTimer.current) {
        window.clearTimeout(autoResumeTimer.current);
      }
      console.log('🧹 Journey control hook cleaned up');
    };
  }, []);
  
  return {
    state,
    update,
    shouldMoveCamera,
    reset,
    dispatch, // Expose for manual control if needed
    currentCheckpointIndex: state.phase === 'atCheckpoint' ? state.index : -1,
    isAtCheckpoint: state.phase === 'atCheckpoint',
    isResuming: state.phase === 'resuming',
    isCompleted: state.phase === 'completed'
  };
} 