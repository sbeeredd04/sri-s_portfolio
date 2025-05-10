import { NextResponse } from 'next/server';
import { generateResponse, formatChatHistory } from '../../utils/gemini';
import fs from 'fs';
import path from 'path';

// Fallback responses for cases where Gemini fails - written in first person as Sri
const fallbackResponses = {
  greeting: [
    "Hey there! What would you like to know about me or my work?",
    "Hi! Thanks for reaching out. What can I tell you about my experience or projects?",
    "Hello! I'm glad you're interested in my portfolio. What would you like to discuss?"
  ],
  error: [
    "Sorry, I seem to be having some connection issues. Could we try that again?",
    "Hmm, I couldn't process that properly. Mind rephrasing your question?",
    "I apologize, but I couldn't formulate a proper response to that. Let's try a different question."
  ]
};

// Read the about_me.txt file content on server startup - this is Sri's personal information
let aboutMeContext = '';
try {
  const aboutMePath = path.join(process.cwd(), 'data', 'about_me.txt');
  aboutMeContext = fs.readFileSync(aboutMePath, 'utf-8');
  console.log('Successfully loaded about_me.txt for context.');
} catch (error) {
  console.error('Failed to load about_me.txt:', error);
  aboutMeContext = "Error: Could not load my personal information."; // Updated fallback message
}

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
 * Process incoming chat messages and generate responses
 * Uses the content of about_me.txt as Sri's direct memory to answer as himself
 */
export async function POST(request) {
  try {
    const { message, messages } = await request.json();
    
    // Format chat history for Gemini if provided
    const chatHistory = messages ? formatChatHistory(messages) : [];
    
    let source = 'sri_direct'; // Updated source to reflect it's Sri directly answering
    
    // Try to generate a response using Gemini, with the aboutMeContext as Sri's memory
    try {
      const geminiResponse = await generateResponse(message, aboutMeContext, chatHistory);
      
      // Return the generated response
      return NextResponse.json({ 
        message: geminiResponse,
        category: 'sri_response', // Updated category
        source: source
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
      
      return NextResponse.json({ 
        message: fallbackResponse,
        category: responseCategory,
        source: 'sri_fallback'
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