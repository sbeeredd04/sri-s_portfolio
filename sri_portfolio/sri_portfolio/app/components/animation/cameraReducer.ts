// ──────────────────────────────────────────────────────────────────────────────
// CAMERA STATE MACHINE - Finite State Machine for Journey Control
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Camera States:
 * - traveling: Moving along the curve, checking for checkpoints
 * - atCheckpoint: Paused at a specific checkpoint for user to read
 * - resuming: Catching up from pause to current scroll position
 * - completed: Journey finished, ready to transition out
 */
export type CameraState =
  | { phase: 'traveling' }
  | { phase: 'atCheckpoint'; index: number }
  | { phase: 'resuming'; fromIndex: number }
  | { phase: 'completed' };

/**
 * State Machine Actions:
 * - REACH_CHECKPOINT: Camera has reached a checkpoint stopT
 * - USER_RESUME: User scrolled while paused (immediate resume)
 * - AUTO_RESUME: 5-second timeout fired (fallback resume)
 * - CATCH_UP_COMPLETE: Resume animation finished, back to traveling
 * - JOURNEY_COMPLETE: Camera reached end of journey (cameraT >= 0.95)
 */
export type CameraAction =
  | { type: 'REACH_CHECKPOINT'; index: number }
  | { type: 'USER_RESUME' }
  | { type: 'AUTO_RESUME' }
  | { type: 'CATCH_UP_COMPLETE' }
  | { type: 'JOURNEY_COMPLETE' };

/**
 * FSM Reducer: Pure function defining all valid state transitions
 * 
 * TRANSITIONS:
 * traveling → atCheckpoint (when cameraT >= stopT[index])
 * atCheckpoint → resuming (when user scrolls OR auto-timeout)
 * resuming → traveling (when catch-up animation completes)
 * traveling → completed (when cameraT >= 0.95)
 */
export function cameraReducer(
  state: CameraState,
  action: CameraAction
): CameraState {
  console.log(`🎬 CameraFSM: ${state.phase} + ${action.type}`);
  
  switch (state.phase) {
    case 'traveling':
      if (action.type === 'REACH_CHECKPOINT') {
        console.log(`🛑 Pausing at checkpoint ${action.index}`);
        return { phase: 'atCheckpoint', index: action.index };
      }
      if (action.type === 'JOURNEY_COMPLETE') {
        console.log('🏁 Journey completed');
        return { phase: 'completed' };
      }
      return state;

    case 'atCheckpoint':
      if (action.type === 'USER_RESUME') {
        console.log(`👆 User resume from checkpoint ${state.index}`);
        return { phase: 'resuming', fromIndex: state.index };
      }
      if (action.type === 'AUTO_RESUME') {
        console.log(`⏰ Auto-resume from checkpoint ${state.index}`);
        return { phase: 'resuming', fromIndex: state.index };
      }
      return state;

    case 'resuming':
      if (action.type === 'CATCH_UP_COMPLETE') {
        console.log('✅ Catch-up complete, resuming travel');
        return { phase: 'traveling' };
      }
      if (action.type === 'JOURNEY_COMPLETE') {
        console.log('🏁 Journey completed during resume');
        return { phase: 'completed' };
      }
      return state;

    case 'completed':
      // Terminal state - no transitions out
      return state;

    default:
      console.warn('🚨 Unknown camera state:', state);
      return state;
  }
}

/**
 * Initial state for the camera FSM
 */
export const initialCameraState: CameraState = { phase: 'traveling' }; 