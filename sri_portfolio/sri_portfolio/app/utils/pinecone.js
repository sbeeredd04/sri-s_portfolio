import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

const ACTUAL_INDEX_NAME = 'sri'; // Correct index name
const ACTUAL_INDEX_HOST = 'https://sri-6tdo11d.svc.aped-4627-b74a.pinecone.io'; // Correct index host

/**
 * Initialize the Pinecone client and return the instance
 * @returns {Pinecone} The Pinecone client instance
 */
export const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.error('PINECONE_API_KEY is not set in environment variables');
      throw new Error('PINECONE_API_KEY is required');
    }
    
    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
    console.log('Pinecone client initialized successfully');
  }
  return pineconeClient;
};

/**
 * Get the Pinecone index for the portfolio knowledge base
 * @returns {Object} The Pinecone index
 */
export const getPineconeIndex = () => {
  if (!pineconeIndex) {
    const pc = getPineconeClient();
    // Use the actual index name and host directly
    const indexName = ACTUAL_INDEX_NAME;
    const indexHost = ACTUAL_INDEX_HOST;
    console.log(`Using Pinecone index: ${indexName} at host: ${indexHost}`);
    pineconeIndex = pc.index(indexName, indexHost);
  }
  return pineconeIndex;
};

/**
 * Create the Pinecone index if it doesn't exist
 * @returns {Promise<void>}
 */
export const createPineconeIndex = async () => {
  try {
    const pc = getPineconeClient();
    const indexName = ACTUAL_INDEX_NAME; // Use correct index name
    
    // Check if index exists
    console.log('Checking if index exists...');
    const existingIndexes = await pc.listIndexes();
    const indexList = Array.isArray(existingIndexes) ? existingIndexes : (existingIndexes.indexes || []);
    console.log('Available indexes:', indexList.map(idx => idx.name || idx).join(', ') || 'None');
    
    const indexExists = indexList.some(idx => (idx.name || idx) === indexName);
    
    if (!indexExists) {
      console.log(`Creating new Pinecone index: ${indexName}`);
      // Ensure parameters match your 'sri' index configuration if this were to be used
      await pc.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
        embed: {
          model: 'llama-text-embed-v2', 
          fieldMap: { text: 'chunk_text' }, 
        },
        waitUntilReady: true,
      });
      console.log('Pinecone index created successfully');
    } else {
      console.log(`Pinecone index ${indexName} already exists`);
    }
    
    // Test the connection to the index
    const indexStats = await getPineconeIndex().describeIndexStats();
    console.log('Index statistics:', JSON.stringify(indexStats, null, 2));
    
  } catch (error) {
    console.error('Error creating or connecting to Pinecone index:', error);
    throw error;
  }
};

/**
 * Split text into chunks for vector database
 * @param {string} text - The text to split
 * @param {number} chunkSize - Size of each chunk (default: 500)
 * @param {number} overlap - Number of overlapping characters (default: 100)
 * @returns {Array<string>} Array of text chunks
 */
export const chunkText = (text, chunkSize = 500, overlap = 100) => {
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    // Calculate the end position for this chunk
    let end = Math.min(i + chunkSize, text.length);
    
    // If we're not at the end of the text and the current end doesn't end with a period,
    // try to find the last period within a reasonable range to create natural breaks
    if (end < text.length && text[end] !== '.') {
      const lastPeriodPos = text.lastIndexOf('.', end);
      if (lastPeriodPos > i && lastPeriodPos > end - 100) {
        end = lastPeriodPos + 1; // Include the period
      }
    }
    
    // Create the chunk and add to array
    chunks.push(text.slice(i, end).trim());
    
    // Move to next position, accounting for overlap
    i = end - overlap;
    if (i < 0) i = 0; // Safety check
    
    // Break if we're at the end
    if (i >= text.length) break;
  }
  
  return chunks;
};

/**
 * Process a text file and upsert chunks to Pinecone
 * @param {string} filePath - Path to the text file
 * @param {string} namespace - Namespace to use in Pinecone (default: 'sri-s-knowledge-base')
 * @returns {Promise<number>} Number of chunks upserted
 */
export const processAndUpsertFile = async (filePath, namespace = 'sri-s-knowledge-base') => {
  try {
    // Read the file
    const fullPath = path.join(process.cwd(), filePath);
    console.log(`Reading file from: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    const text = fs.readFileSync(fullPath, 'utf-8');
    console.log(`Text loaded: ${text.length} characters`);
    
    // Chunk the text
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks`);
    
    // Get the index
    const index = getPineconeIndex().namespace(namespace);
    
    // Prepare records for upserting
    const records = chunks.map((chunk, i) => ({
      _id: `chunk-${i}-${Date.now()}`,
      chunk_text: chunk,
      category: 'profile', // Default category
      source: path.basename(filePath)
    }));
    
    console.log(`Upserting ${records.length} records to namespace: ${namespace}`);
    
    // Upsert the records
    await index.upsertRecords(records); // Ensure this matches Pinecone SDK v3
    
    console.log(`Upserted ${records.length} chunks to Pinecone namespace: ${namespace}`);
    return records.length;
  } catch (error) {
    console.error('Error processing and upserting file:', error);
    throw error;
  }
};

/**
 * Perform semantic search in Pinecone
 * @param {string} query - The search query
 * @param {string} namespace - Namespace to search in (default: 'sri-s-knowledge-base')
 * @param {number} topK - Number of results to return (default: 5)
 * @returns {Promise<Array>} Array of search results
 */
export const semanticSearch = async (query, namespace = 'sri-s-knowledge-base', topK = 5) => {
  try {
    console.log(`Searching for: "${query}" in namespace: ${namespace}, topK: ${topK}`);
    
    // Get the index (already points to 'sri')
    const index = getPineconeIndex(); 
    
    // Use the modern searchRecords API for text-based semantic search
    const response = await index.namespace(namespace).searchRecords({
      query: {
        topK: topK,
        inputs: { text: query },
      },
      fields: ['chunk_text', 'category', 'source'],
    });
    
    console.log(`Search returned ${response.result.hits.length} hits`);
    
    if (response.result.hits.length > 0 && response.result.hits[0]._score) {
      console.log(`Top match score: ${response.result.hits[0]._score.toFixed(4)}`);
    } else if (response.result.hits.length > 0) {
      console.log('Top match found, but score is undefined.');
    }
    
    return response.result.hits;
  } catch (error) {
    console.error('Error during semantic search:', error);
    // Check if the error is due to the index not being ready or not found
    if (error.message && error.message.includes('404')) {
      console.error(`Potential issue: Index '${ACTUAL_INDEX_NAME}' might not be fully initialized or accessible.`);
    }
    throw error;
  }
};

/**
 * Delete all records in a namespace
 * @param {string} namespace - Namespace to clear (default: 'sri-s-knowledge-base')
 * @returns {Promise<void>}
 */
export const clearNamespace = async (namespace = 'sri-s-knowledge-base') => {
  try {
    const index = getPineconeIndex().namespace(namespace); // targets 'sri' index
    await index.deleteRecords({ deleteAll: true });
    console.log(`Cleared all records in namespace: ${namespace}`);
  } catch (error) {
    console.error('Error clearing namespace:', error);
    throw error;
  }
};

/**
 * Delete the Pinecone index
 * @returns {Promise<void>}
 */
export const deletePineconeIndex = async () => {
  try {
    const pc = getPineconeClient();
    const indexName = ACTUAL_INDEX_NAME; // Use correct index name
    await pc.deleteIndex(indexName);
    console.log(`Deleted Pinecone index: ${indexName}`);
  } catch (error) {
    console.error('Error deleting Pinecone index:', error);
    throw error;
  }
}; 