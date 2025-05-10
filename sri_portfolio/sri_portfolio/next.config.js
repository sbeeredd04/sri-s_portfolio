/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NETWORK_URL: 'http://localhost:3000/',
  },
}

module.exports = nextConfig; 