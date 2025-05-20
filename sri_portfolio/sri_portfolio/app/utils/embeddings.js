import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Embedding model configuration
const EMBEDDING_MODEL = "text-embedding-004";
// Using a large chunk size since our about_me.txt is relatively small
// This ensures we capture full context in the embeddings
const CHUNK_SIZE = 8000; // characters per chunk - increased for better context
const CHUNK_OVERLAP = 1000; // overlap between chunks

// In-memory storage for embeddings
let embeddingCache = null;

// Track initialization status
let isInitializing = false;

/**
 * Initialize the Gemini client for embeddings
 * @returns {GoogleGenAI} The Gemini client
 */
const getEmbeddingClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is required');
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Split text into overlapping chunks
 * @param {string} text - The text to chunk
 * @returns {Array<string>} Array of text chunks
 */
const chunkText = (text) => {
  if (!text || typeof text !== 'string' || text.length === 0) {
    console.warn('Empty or invalid text provided for chunking');
    return []; 
  }
  
  // If text is smaller than chunk size, just return the whole text as one chunk
  if (text.length <= CHUNK_SIZE) {
    console.log(`Text length (${text.length}) <= chunk size (${CHUNK_SIZE}). Using single chunk.`);
    return [text];
  }
  
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    const chunk = text.substring(i, i + CHUNK_SIZE);
    chunks.push(chunk);
    i += (CHUNK_SIZE - CHUNK_OVERLAP);
  }
  
  console.log(`Split text into ${chunks.length} chunks of approx. ${CHUNK_SIZE} chars each`);
  return chunks;
};

/**
 * Generate embeddings for a text chunk
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} The embedding vector
 */
const generateEmbedding = async (text) => {
  try {
    console.log(`Generating embedding for text of length ${text?.length || 0} chars`);
    const ai = getEmbeddingClient();
    // Ensure text is not empty and is a string
    const cleanText = text?.trim() || "No content available";
    
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL, 
      contents: cleanText,
      taskType: "RETRIEVAL_DOCUMENT" // Optimized for document retrieval
    });
    
    // Check if we have valid embeddings
    if (!result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
      throw new Error("No embedding values returned from API");
    }
    
    console.log(`Successfully generated embedding of size: ${result.embeddings[0].values.length}`);
    return result.embeddings[0].values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} The cosine similarity (-1 to 1)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    console.error('Invalid vectors for similarity calculation');
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  // Avoid division by zero
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Initialize embeddings from the about_me file
 * @returns {Promise<void>}
 */
export const initializeEmbeddings = async () => {
  if (embeddingCache) {
    console.log('🟢 Embeddings already initialized and cached in memory');
    return;
  }
  
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log('⏳ Embeddings initialization already in progress');
    return;
  }
  
  try {
    isInitializing = true;
    console.log('🚀 Starting to initialize embeddings...');
    const aboutMePath = path.join(process.cwd(), 'data', 'about_me.txt');
    const aboutMeText = fs.readFileSync(aboutMePath, 'utf-8');
    console.log(`📄 Loaded about_me.txt: ${aboutMeText.length} characters`);
    
    // Split the text into chunks
    const chunks = chunkText(aboutMeText);
    console.log(`🔪 Split about_me.txt into ${chunks.length} chunks`);
    
    // Generate embeddings for each chunk
    embeddingCache = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📊 Generating embedding for chunk ${i+1}/${chunks.length} (${chunk.length} chars)`);
      const embedding = await generateEmbedding(chunk);
      embeddingCache.push({
        text: chunk,
        embedding: embedding
      });
      console.log(`✅ Generated embedding for chunk ${i+1}/${chunks.length}`);
    }
    
    console.log(`🎉 Embeddings initialization complete! Cached ${embeddingCache.length} embeddings`);
  } catch (error) {
    console.error('❌ Failed to initialize embeddings:', error);
    embeddingCache = null; // Reset cache on error
    throw error;
  } finally {
    isInitializing = false;
  }
};

/**
 * Get the most relevant context based on a query
 * @param {string} query - The user's query
 * @param {number} topK - Number of chunks to return
 * @returns {Promise<string>} The most relevant context
 */
export const getRelevantContext = async (query, topK = 1) => {
  console.log(`🔍 Getting relevant context for query: "${query}"`);
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.warn('⚠️ Empty query provided, returning full context');
    // If query is empty, return the first chunk as default
    if (embeddingCache && embeddingCache.length > 0) {
      return embeddingCache[0].text;
    }
    return '';
  }
  
  if (!embeddingCache || embeddingCache.length === 0) {
    // If embeddings aren't initialized and not currently initializing, initialize them
    if (!isInitializing) {
      console.warn('⚠️ Embeddings not initialized, initializing now...');
      await initializeEmbeddings();
    } else {
      console.warn('⏳ Embeddings initialization in progress, waiting...');
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If still not initialized, return empty string
      if (!embeddingCache || embeddingCache.length === 0) {
        console.warn('❌ Embeddings still not available after waiting');
        return '';
      }
    }
  }
  
  try {
    console.log(`🧠 Using ${embeddingCache.length} cached embeddings for search`);
    
    // Generate embedding for the query
    console.log(`🔤 Generating embedding for query: "${query}"`);
    const queryEmbedding = await generateEmbedding(query);
    console.log(`✅ Query embedding generated successfully`);
    
    // Calculate similarity with each chunk
    console.log(`📊 Calculating similarities between query and ${embeddingCache.length} chunks`);
    const similarities = embeddingCache.map((chunk, index) => ({
      index,
      text: chunk.text,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Log the similarity scores for debugging
    console.log(`📈 Similarity scores for chunks:`);
    similarities.forEach((item) => {
      console.log(`   Chunk ${item.index}: ${item.similarity.toFixed(4)} (${item.text.substring(0, 30)}...)`);
    });
    
    // Return top K chunks concatenated
    const topChunks = similarities.slice(0, Math.min(topK, similarities.length));
    
    console.log(`🏆 Selected top ${topChunks.length} chunks with highest similarity`);
    topChunks.forEach((chunk, i) => {
      console.log(`   Top chunk ${i+1}: similarity ${chunk.similarity.toFixed(4)}`);
    });
    
    const result = topChunks.map(chunk => chunk.text).join('\n\n');
    console.log(`📝 Returning context of ${result.length} characters`);
    
    return result;
  } catch (error) {
    console.error('❌ Error getting relevant context:', error);
    // Fall back to returning first chunk on error
    if (embeddingCache && embeddingCache.length > 0) {
      console.log('⚠️ Falling back to first chunk due to error');
      return embeddingCache[0].text;
    }
    return '';
  }
};

/**
 * Check if embeddings are initialized
 * @returns {boolean} Whether embeddings are initialized
 */
export const areEmbeddingsInitialized = () => {
  const initialized = !!embeddingCache && embeddingCache.length > 0;
  console.log(`🔍 Checking if embeddings are initialized: ${initialized ? 'YES' : 'NO'}`);
  return initialized;
}; 