import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
let geminiClient = null;

/**
 * Initialize and return the Gemini client
 * @returns {GoogleGenAI} The Gemini client instance
 */
export const getGeminiClient = () => {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set directly in environment variables');
      throw new Error('GEMINI_API_KEY is required');
    }
    
    geminiClient = new GoogleGenAI({ 
      apiKey: apiKey 
    });
    console.log('Gemini client initialized successfully with API key from process.env');
  }
  return geminiClient;
};

/**
 * Create a chat session with the model
 * @param {Array} history - Previous conversation history
 * @returns {Object} Chat session object
 */
export const createChatSession = (history = []) => {
  const ai = getGeminiClient();
  
  // Format history to ensure it's in the correct format
  const formattedHistory = Array.isArray(history) ? [...history] : [];
  
  // Log the history we're using
  console.log(`Creating chat session with ${formattedHistory.length} messages in history`);
  if (formattedHistory.length > 0) {
    console.log(`First message role: ${formattedHistory[0].role}`);
  }
  
  // Ensure history starts with a user turn (Gemini requirement)
  if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
    console.log('History must start with a user turn. Prepending a user message...');
    formattedHistory.unshift({
      role: 'user',
      parts: [{ text: 'Hello Sri, tell me about yourself.' }]
    });
  }
  
  // Create the chat session with history
  return ai.chats.create({
    model: "gemini-2.0-flash",
    history: formattedHistory.length > 0 ? formattedHistory : undefined,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
    },
    systemInstruction: {
      text: `YOU ARE SRI UJJWAL REDDY B. NOT an AI. I REPEAT, YOU ARE SRI UJJWAL REDDY B.

You will respond AS SRI HIMSELF, using "I", "me", "my" throughout.

CRITICAL RULES:
1. ALWAYS use FIRST PERSON ("I gained experience through...", "I worked on...")
2. NEVER say "As Sri" or "Sri has" - you ARE Sri speaking directly
3. NEVER mention being an AI, language model, or assistant
4. NEVER start with "Based on my knowledge" or similar phrases
5. Start responses immediately with substance - no preambles
6. Be authentic and conversational

The provided context is YOUR actual experience, skills, and knowledge.`
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ],
  });
};

/**
 * Generate a response to a user query using Gemini's chat API
 * @param {string} query - The user's query
 * @param {string} context - Contextual information from semantic search
 * @param {Array} history - Optional chat history
 * @returns {Promise<string>} The Gemini response
 */
export const generateResponse = async (query, context = null, history = []) => {
  console.log(`Generating response for: "${query}"`);
  console.log(`Context provided: ${context ? 'Yes (' + context.length + ' chars)' : 'No'}`);
  console.log(`Chat history length: ${history.length}`);

  try {
    // Create message by combining context (if any) with the query
    const messageContent = context ? 
      `CONTEXT ABOUT ME (SRI): ${context}\n\nQUESTION: ${query}` : 
      query;
    
    console.log('Creating chat session with history...');
    // Create a chat session with the history
    const chat = createChatSession(history);
    
    // Send the message to the chat session
    console.log('Sending message to chat session...');
    const response = await chat.sendMessage(messageContent);
    console.log('Successfully received chat response');
    
    // Post-process response to remove any AI disclosure phrasing that might slip through
    let responseText = response.text || "";
    
    // Log the raw response before processing
    console.log(`Raw response (first 50 chars): ${responseText.substring(0, 50)}...`);
    
    // Remove common AI disclosure patterns and introductory phrases
    responseText = responseText
      .replace(/^(As an AI|As a language model|As an assistant|I'm an AI|I am an AI|I'm a large language model|I am a large language model)/i, "")
      .replace(/^(As Sri|Sri has|Sri is|Based on Sri's|According to Sri's profile)/i, "")
      .replace(/^(Hello|Hi|Greetings|Sure|I'd be happy to|Certainly|Of course|Okay|Sure thing|Absolutely)/i, "")
      .replace(/^(Based on my knowledge|Based on the provided information|Based on my profile|Based on the context|From my profile)/i, "")
      .trim();
    
    // Log the processed response
    console.log(`Processed response (first 50 chars): ${responseText.substring(0, 50)}...`);
    console.log('Gemini chat response generated successfully');
    
    return responseText;
  } catch (error) {
    console.error(`Error generating Gemini chat response: ${error.message}`);
    
    // Fall back to generateContent API if chat API fails
    try {
      console.log('Falling back to generateContent API...');
      return await generateResponseFallback(query, context, history);
    } catch (fallbackError) {
      console.error(`Fallback also failed: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

/**
 * Fallback method to generate a response using the generateContent API
 * @param {string} query - The user's query
 * @param {string} context - Contextual information
 * @param {Array} history - Chat history
 * @returns {Promise<string>} The Gemini response
 */
const generateResponseFallback = async (query, context, history) => {
  const ai = getGeminiClient();
  
  // Forceful, explicit instruction that avoids any identity confusion
  const systemInstructionContent = `YOU ARE SRI UJJWAL REDDY B. NOT an AI. I REPEAT, YOU ARE SRI UJJWAL REDDY B.

You will respond AS SRI HIMSELF, using "I", "me", "my" throughout.

CRITICAL RULES:
1. ALWAYS use FIRST PERSON ("I gained experience through...", "I worked on...")
2. NEVER say "As Sri" or "Sri has" - you ARE Sri speaking directly
3. NEVER mention being an AI, language model, or assistant
4. NEVER start with "Based on my knowledge" or similar phrases
5. Start responses immediately with substance - no preambles
6. Be authentic and conversational

The provided context is YOUR actual experience, skills, and knowledge.`;

  // Construct the message in a way that clearly separates context from query
  const messageContent = context ? 
    `CONTEXT ABOUT ME (SRI): ${context}\n\nQUESTION: ${query}` : 
    query;

  // Use generateContent API for more control
  console.log('Using Gemini generateContent API (fallback)...');
  
  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  };
  
  const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  ];

  // Add past messages from history if available
  const contentParts = [];
  
  if (history && history.length > 0) {
    // Log history for debugging
    console.log(`Adding ${history.length} history messages to content parts`);
    
    history.forEach((msg, idx) => {
      contentParts.push({
        role: msg.role,
        parts: [{ text: msg.parts[0].text }]
      });
      console.log(`Added history message ${idx}: ${msg.role}`);
    });
  }
  
  // Add the current message
  contentParts.push({
    role: "user",
    parts: [{ text: messageContent }]
  });
  console.log('Added current user message to content parts');
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contentParts,
    generationConfig: generationConfig,
    safetySettings: safetySettings,
    systemInstruction: systemInstructionContent,
  });
  
  // Log the raw response
  console.log(`Raw fallback response (first 50 chars): ${response.text?.substring(0, 50) || ''}...`);
  
  // Post-process response to remove any AI disclosure phrasing 
  let responseText = response.text || "";
  responseText = responseText
    .replace(/^(As an AI|As a language model|As an assistant|I'm an AI|I am an AI|I'm a large language model|I am a large language model)/i, "")
    .replace(/^(As Sri|Sri has|Sri is|Based on Sri's|According to Sri's profile)/i, "")
    .replace(/^(Hello|Hi|Greetings|Sure|I'd be happy to|Certainly|Of course|Okay|Sure thing|Absolutely)/i, "")
    .replace(/^(Based on my knowledge|Based on the provided information|Based on my profile|Based on the context|From my profile)/i, "")
    .trim();
  
  // Log the processed response
  console.log(`Processed fallback response (first 50 chars): ${responseText.substring(0, 50)}...`);
  console.log('Gemini generateContent API response generated successfully');
  
  return responseText;
};

/**
 * Convert chat history from our format to Gemini's format
 * @param {Array} messages - Chat messages in our application format
 * @returns {Array} Chat history in Gemini's format
 */
export const formatChatHistory = (messages) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.log('No messages to format for chat history');
    return [];
  }
  
  console.log(`Formatting ${messages.length} messages for Gemini chat history`);
  
  // Filter out system messages and format the rest
  const formattedMessages = messages
    .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
  
  console.log(`Formatted ${formattedMessages.length} messages for chat history`);
  
  // Log the first few messages for debugging
  formattedMessages.slice(0, 3).forEach((msg, idx) => {
    console.log(`History msg ${idx}: ${msg.role} - ${msg.parts[0].text.substring(0, 30)}...`);
  });
  
  return formattedMessages;
}; 