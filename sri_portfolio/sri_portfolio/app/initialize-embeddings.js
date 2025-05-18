import { initializeEmbeddings, areEmbeddingsInitialized } from './utils/embeddings';

// Global initialization state
let initializationPromise = null;

/**
 * This script initializes embeddings when the application starts
 * Uses a singleton pattern to ensure initialization happens only once
 */
export async function initializeApp() {
  // If initialization is already in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Create a new initialization promise if none exists
  initializationPromise = (async () => {
    try {
      if (!areEmbeddingsInitialized()) {
        console.log('🔄 Initializing embeddings on application startup...');
        await initializeEmbeddings();
        console.log('✅ Embeddings initialization complete!');
      } else {
        console.log('✅ Embeddings already initialized');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize embeddings:', error);
      // Reset the promise so we can try again
      initializationPromise = null;
      return false;
    }
  })();
  
  return initializationPromise;
}

// Call initializeApp immediately to start the embedding process
initializeApp().catch(console.error); 