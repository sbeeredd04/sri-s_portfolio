/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// Load .env file manually with specific path for local development
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  // Check if .env exists at the current working directory
  if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`);
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    // Set each variable from .env to process.env
    for (const key in envConfig) {
      if (!process.env[key]) { // Don't overwrite existing env vars
        process.env[key] = envConfig[key];
      }
    }
  } else {
    console.log('No .env file found at current working directory, using process.env values');
  }
}

// Only load .env in development, Vercel handles env vars in production
if (process.env.NODE_ENV !== 'production') {
  try {
    // Try loading dotenv
    require('dotenv').config();
    // Also try loading with specific path
    loadEnv();
  } catch (error) {
    console.warn('dotenv not installed, skipping .env load:', error.message);
  }
}

// Debug environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('ALLOWED_DOMAINS:', process.env.ALLOWED_DOMAINS);
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
}

const nextConfig = {
  reactStrictMode: true,
  env: {
    // Backend-only secrets (not exposed to browser)
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    
    // Domain security - allowed domains for the chat API
    // Make sure this includes your Vercel deployment URL and custom domain
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS || 'localhost,127.0.0.1,sriujjwalreddy.vercel.app,sriujjwalreddy.com',
    
    // Public variables (exposed to browser)
    NEXT_PUBLIC_NETWORK_URL: process.env.NETWORK_URL || process.env.NEXT_PUBLIC_NETWORK_URL || 'http://localhost:3000/',
  },
  // This ensures environment variables are re-evaluated on each request in development
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  }
}

module.exports = nextConfig; 