import { NextResponse } from 'next/server';
import { generateResponse, formatChatHistory } from '../../utils/gemini';
import { getRelevantContext, areEmbeddingsInitialized } from '../../utils/embeddings';
import { initializeApp } from '../../initialize-embeddings';
import fs from 'fs';
import path from 'path';

// Fallback responses for cases where Gemini fails - written in first person as Sri
const fallbackResponses = {
  greeting: [
    "Hello! How can I assist you today with information about Sri Ujjwal Reddy B.?",
    "Hi there! I'm Sri's AI assistant. What would you like to know about his work or projects?",
    "Greetings! I can help answer your questions about Sri. What are you interested in?"
  ],
  error: [
    "My apologies, I seem to be having trouble connecting. Could you please try asking again?",
    "Hmm, I couldn't quite process that. Would you mind rephrasing your question about Sri?",
    "I'm sorry, but I couldn't generate a response. Perhaps try a different question about Sri?"
  ]
};

// Read the about_me.txt file content on server startup as a fallback
let aboutMeContext = '';
try {
  const aboutMePath = path.join(process.cwd(), 'data', 'about_me.txt');
  aboutMeContext = fs.readFileSync(aboutMePath, 'utf-8');
  console.log('Successfully loaded about_me.txt for context fallback.');
} catch (error) {
  console.error('Failed to load about_me.txt:', error);
  aboutMeContext = "Error: Could not load information about Sri Ujjwal Reddy B."; // Updated fallback message
}

// No need for self-executing function here - initialization happens in initialize-embeddings.js
// Just make sure embeddings are ready when needed

/**
 * Get a random response from a category
 * @param {string} category - The response category
 * @returns {string} A random response
 */
function getRandomResponse(category) {
  const responses = fallbackResponses[category] || fallbackResponses.error;
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Get the list of allowed domains from environment variables
 * @returns {string[]} Array of allowed domains
 */
function getAllowedDomains() {
  // Default allowed domains if env variable is not set
  const defaultDomains = [
    'localhost',
    '127.0.0.1',
    'sriujjwalreddy.vercel.app',
    'www.sriujjwalreddy.com',
    'sriujjwalreddy.com',
    'sri-portfolio-qpyqwkk19-sbeeredd04s-projects.vercel.app',
    'sri-s-portfolio.vercel.app',
    'sri-s-portfolio-git-main-sbeeredd04s-projects.vercel.app',
    'vercel.app' // Allow all Vercel preview deployments
  ];
  
  // Check if ALLOWED_DOMAINS is defined in environment variables
  const envDomains = process.env.ALLOWED_DOMAINS;
  
  if (envDomains) {
    // Split comma-separated domains and trim whitespace
    const domains = envDomains.split(',').map(domain => domain.trim());
    console.log('Using allowed domains from environment:', domains);
    return domains;
  }
  
  // Log for debugging purposes
  console.log('ALLOWED_DOMAINS not found directly in environment variables, using defaults:', defaultDomains);
  return defaultDomains;
}

/**
 * Check if the request is from an allowed origin
 * @param {Request} request - The incoming request
 * @returns {boolean} Whether the request is allowed
 */
function isRequestAllowed(request) {
  // Get the request origin or referer header
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Request origin:', origin);
  console.log('Request referer:', referer);
  
  // In development, accept localhost requests
  if (process.env.NODE_ENV === 'development') {
    const isDev = 
      (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) ||
      (referer && (referer.includes('localhost') || referer.includes('127.0.0.1')));
    
    if (isDev) {
      console.log('Development request accepted');
      return true;
    }
  }
  
  // Get allowed domains from environment variables
  const allowedDomains = getAllowedDomains();
  
  // Make a more flexible domain check function that handles variations
  const matchesDomain = (url, domain) => {
    if (!url) return false;
    
    // Handle http:// and https:// prefixes
    const urlLower = url.toLowerCase();
    const domainLower = domain.toLowerCase();
    
    // Check for exact domain match or subdomain match
    return urlLower.includes(`//${domainLower}`) || // matches domain with protocol
           urlLower.includes(`.${domainLower}`) || // matches subdomain
           urlLower.includes(`//${domainLower}/`) || // matches domain with path
           urlLower === domainLower; // exact match
  };
  
  // Check if origin is from an allowed domain
  let isAllowed = false;
  if (origin) {
    isAllowed = allowedDomains.some(domain => matchesDomain(origin, domain));
    if (isAllowed) {
      console.log(`Request allowed from origin: ${origin}`);
    }
  }
  
  // If not allowed by origin, check referer
  if (!isAllowed && referer) {
    isAllowed = allowedDomains.some(domain => matchesDomain(referer, domain));
    if (isAllowed) {
      console.log(`Request allowed from referer: ${referer}`);
    }
  }
  
  // Always allow Vercel preview deployments
  if (!isAllowed && (origin?.includes('vercel.app') || referer?.includes('vercel.app'))) {
    console.log('Request allowed from Vercel preview deployment');
    isAllowed = true;
  }
  
  // Final verdict
  if (!isAllowed) {
    console.warn(`Request BLOCKED. Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);
  }
  
  return isAllowed;
}

/**
 * Process incoming chat messages and generate responses
 * Uses semantic search with embeddings to find relevant context
 * Maintains chat history for multi-turn conversations
 */
export async function POST(request) {
  try {
    // Check if request is from an allowed origin
    if (!isRequestAllowed(request)) {
      console.warn('Unauthorized request from external origin');
      return NextResponse.json(
        { error: 'Unauthorized. External requests are not allowed.' },
        { status: 403 }
      );
    }
    
    const { message, messages } = await request.json();
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Format chat history from client's message history
    // This is crucial for multi-turn conversations
    const chatHistory = messages ? formatChatHistory(messages) : [];
    console.log(`Formatted ${chatHistory.length} messages for chat history`);
    
    // Log the chat history (for debugging)
    if (chatHistory.length > 0) {
      console.log('Chat history summary:');
      chatHistory.forEach((msg, idx) => {
        console.log(`[${idx}] ${msg.role}: ${msg.parts[0].text.substring(0, 50)}...`);
      });
    }
    
    let source = 'sri_semantic_search'; // Default source
    
    try {
      // Make sure embeddings are initialized 
      if (!areEmbeddingsInitialized()) {
        console.log('Ensuring embeddings are initialized before processing request...');
        await initializeApp();
      }
      
      // With the new larger chunks, we might just need the full context always
      // But we'll still use the semantic search to get the most relevant parts
      const NUM_CHUNKS = 1; // Since we've made chunks larger, we can keep this at 1
      
      // Use embeddings to find relevant context
      console.log('Getting relevant context through embeddings...');
      let context = '';
      
      try {
        context = await getRelevantContext(message, NUM_CHUNKS);
        console.log(`Retrieved ${context.length} characters of relevant context`);
      } catch (contextError) {
        console.error('Error getting relevant context:', contextError);
        // Fall back to full text on context error
        context = aboutMeContext;
        source = 'sri_direct';
      }
      
      // If no context found through embeddings, fall back to full text
      if (!context || context.trim() === '') {
        console.log('No relevant context found through embeddings, using full text fallback');
        context = aboutMeContext;
        source = 'sri_direct';
      }
      
      // Generate response with the retrieved context and chat history
      // This is the main change - we now pass chat history to maintain conversation context
      const geminiResponse = await generateResponse(message, context, chatHistory);
      
      // Update history for next turn (not stored server-side, just returned to client)
      // Client will send this back with the next message
      const updatedHistory = [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        },
        {
          role: 'model', 
          parts: [{ text: geminiResponse }]
        }
      ];
      
      // Return the generated response with metadata
      return NextResponse.json({ 
        message: geminiResponse,
        category: 'sri_response',
        source: source,
        history: updatedHistory // Return updated history to client
      });
    } catch (error) {
      console.error('Gemini generation error:', error);
      
      // If Gemini fails, fall back to Sri-voiced template responses
      let responseCategory = 'error';
      
      // Basic greeting detection for fallback
      if (message.toLowerCase().match(/\b(hello|hi|hey|greetings)\b/i)) {
        responseCategory = 'greeting';
      }
      
      const fallbackResponse = getRandomResponse(responseCategory);
      
      // Create fallback history update
      const updatedHistory = [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        },
        {
          role: 'model', 
          parts: [{ text: fallbackResponse }]
        }
      ];
      
      return NextResponse.json({ 
        message: fallbackResponse,
        category: responseCategory,
        source: 'sri_fallback',
        history: updatedHistory // Return updated history even on fallback
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 