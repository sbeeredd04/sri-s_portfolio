/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Backend-only secrets (not exposed to browser)
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    
    // Domain security - allowed domains for the chat API
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS || 'localhost,127.0.0.1,sriujjwalreddy.vercel.app,sriujjwalreddy.com',
    
    // Public variables (exposed to browser)
    NEXT_PUBLIC_NETWORK_URL: process.env.NETWORK_URL || 'http://localhost:3000/',
  },
}

module.exports = nextConfig; 