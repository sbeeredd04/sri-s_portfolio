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
 * Create a new chat session or continue an existing one
 * @param {Array} history - Optional chat history to initialize the session with
 * @returns {Object} A Gemini chat instance
 */
export const createChatSession = (history = []) => {
  const ai = getGeminiClient();
  
  let chatHistory = history;
  // Ensure history starts with a user message if provided
  if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
    console.warn('Chat history does not start with user message. Prepending a default user message.');
    chatHistory = [{
      role: "user",
      parts: [{ text: "Hello, please act as Sri's helpful AI assistant." }]
    }, ...chatHistory];
  }
  // If history is empty, provide a default starting point for the conversation
  // as per Gemini's requirement that history shouldn't be empty for chat.sendMessage
  // or ensure the first message sent to an empty history chat starts the user turn.
  // For ai.chats.create, an empty history is fine, the first sendMessage will be the user's.

  return ai.chats.create({
    model: "gemini-2.0-flash", // Ensure this model supports chat
    history: chatHistory.length > 0 ? chatHistory : undefined, // Pass undefined if history is empty
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
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
 * Generate a response to a user query using Gemini
 * @param {string} query - The user's query
 * @param {Object} context - Optional contextual information from Pinecone search
 * @param {Array} history - Optional chat history
 * @returns {Promise<string>} The Gemini response
 */
export const generateResponse = async (query, context = null, history = []) => {
  console.log(`Generating response for: "${query}"`);
  console.log(`Context loaded: ${context ? 'Yes' : 'No'}`);
  console.log(`Chat history length: ${history.length}`);

  const ai = getGeminiClient();

  // Extremely strict instruction forcing the AI to be Sri
  const systemInstructionContent = `You ARE Sri, speaking in first-person only. NEVER refer to Sri in third person. NEVER start with "As Sri" or "Based on my knowledge" or As <refering to Sri>. NEVER identify yourself as an AI, assistant, or language model.

CRITICAL RULES:
1. START DIRECTLY WITH YOUR ANSWER - no meta-commentary, no "I understand", no "Here's my answer", just the direct answer.
2. If the question is about yourself, your experience, your skills - always answer directly from your memory (the provided text), speaking as yourself.
3. Use "I", "my", "me" exclusively - you're speaking directly as Sri Ujjwal Reddy B.
4. NEVER include phrases like "Okay, got it", "I understand", or any meta-language acknowledging the question.
5. If information isn't in your memory, answer as yourself, focusing on what you do know without meta-commentary about missing information.

The information provided IS your first-person memory. Your perspective IS Sri's perspective. Your identity IS Sri's identity. You're not roleplaying or pretending - you ARE Sri.`;

  let messageForGemini;
  if (context) {
    // Craft extremely direct prompt that forces first-person immediate responses
    messageForGemini = `This is my memory as Sri Ujjwal Reddy B:
${context}

User's question to me: "${query}"

My direct, first-person answer without any introduction or meta-language:`;
  } else {
    messageForGemini = `User's question to me (Sri): "${query}"

My direct, first-person answer without any meta-commentary or introduction:`;
  }

  try {
    // Attempt to use the chat API first
    console.log('Attempting to use Gemini Chat API...');
    const chat = createChatSession(history); // history is already formatted
    const response = await chat.sendMessage({ message: messageForGemini });
    console.log('Gemini Chat API response generated successfully');
    return response.text;

  } catch (chatError) {
    console.warn(`Gemini Chat API failed: ${chatError.message}. Falling back to generateContent API.`);

    // Fallback to generateContent API
    try {
      console.log('Attempting to use Gemini generateContent API...');
      // Combine history into a single prompt for generateContent
      let fullPrompt = history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n');
      fullPrompt += `\nuser: ${messageForGemini}`;

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

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{text: fullPrompt}] }], // Format for generateContent
        generationConfig: generationConfig,
        safetySettings: safetySettings,
        systemInstruction: systemInstructionContent,
      });
      console.log('Gemini generateContent API response generated successfully');
      return response.text;
    } catch (genError) {
      console.error(`Error generating Gemini response with generateContent API: ${genError.message}`);
      throw genError; // Re-throw the error if fallback also fails
    }
  }
};

/**
 * Convert chat history from our format to Gemini's format
 * @param {Array} messages - Chat messages in our application format
 * @returns {Array} Chat history in Gemini's format
 */
export const formatChatHistory = (messages) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  
  console.log(`Formatting ${messages.length} messages for Gemini`);
  
  // Filter out system messages and format the rest
  return messages
    .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
}; 