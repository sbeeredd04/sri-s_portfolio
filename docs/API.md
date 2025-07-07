# API Documentation

This document provides detailed information about the APIs used in Sri's Portfolio.

## Table of Contents

- [Chat API](#chat-api)
- [Embedding System](#embedding-system)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication](#authentication)

## Chat API

### Endpoint: `/api/chat`

**Method**: POST

**Description**: Intelligent chat interface powered by Google Gemini AI with semantic search capabilities through Pinecone vector database.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "message": "string",     // Required: User's message
  "history": [             // Optional: Conversation history
    {
      "role": "user",
      "content": "string"
    },
    {
      "role": "assistant",
      "content": "string"
    }
  ]
}
```

### Response

#### Success Response (200)
```json
{
  "response": "string",           // AI-generated response
  "category": "string",           // Response category (greeting, experience, projects, etc.)
  "source": "string",             // Response source (gemini_ai, sri_fallback, etc.)
  "history": [                    // Updated conversation history
    {
      "role": "user",
      "content": "string"
    },
    {
      "role": "assistant",
      "content": "string"
    }
  ],
  "context": "string"             // Retrieved context (if applicable)
}
```

#### Error Response (400)
```json
{
  "error": "Invalid request format",
  "details": "string"
}
```

#### Error Response (500)
```json
{
  "error": "Failed to process message",
  "details": "string"
}
```

### Example Usage

#### Basic Query
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Tell me about Sri's machine learning experience"
  })
});

const data = await response.json();
console.log(data.response);
```

#### With Conversation History
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "What about his web development skills?",
    history: [
      {
        role: "user",
        content: "Tell me about Sri's machine learning experience"
      },
      {
        role: "assistant",
        content: "Sri has extensive experience in machine learning..."
      }
    ]
  })
});
```

## Embedding System

The portfolio uses a sophisticated embedding system for semantic search and context retrieval.

### How It Works

1. **Content Processing**: Portfolio content is processed into text embeddings
2. **Vector Storage**: Embeddings are stored in Pinecone vector database
3. **Query Processing**: User queries are converted to embeddings
4. **Semantic Search**: Similar content is found using vector similarity
5. **Context Retrieval**: Relevant context is retrieved for AI responses

### Embedding Sources

- **About Me**: Personal information and background
- **Projects**: Project descriptions and details
- **Experience**: Work experience and achievements
- **Skills**: Technical skills and expertise
- **Education**: Educational background

### Search Process

```javascript
// Simplified example of the embedding search process
async function searchContent(query) {
  // 1. Convert query to embedding
  const queryEmbedding = await createEmbedding(query);
  
  // 2. Search similar content in Pinecone
  const results = await pineconeIndex.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true
  });
  
  // 3. Return relevant context
  return results.matches.map(match => match.metadata.text);
}
```

## Error Handling

### Error Types

1. **Validation Errors**: Invalid request format or missing required fields
2. **API Errors**: External API failures (Gemini, Pinecone)
3. **Rate Limiting**: Too many requests from same client
4. **Server Errors**: Internal server issues

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `INVALID_REQUEST`: Request format is invalid
- `MISSING_MESSAGE`: Message field is required
- `API_ERROR`: External API failure
- `RATE_LIMITED`: Rate limit exceeded
- `SERVER_ERROR`: Internal server error

## Rate Limiting

### Limits

- **Per IP**: 100 requests per hour
- **Per Session**: 20 requests per 10 minutes
- **Burst**: 5 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "details": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED",
  "retryAfter": 3600
}
```

## Authentication

Currently, the API uses domain-based authentication:

### Allowed Domains

- `localhost:3000` (development)
- `sriujjwalreddy.com` (production)
- `www.sriujjwalreddy.com` (production)

### Security Measures

1. **Origin Validation**: Requests must come from allowed origins
2. **Content Security Policy**: Strict CSP headers
3. **Rate Limiting**: Prevents abuse
4. **Input Validation**: All inputs are sanitized
5. **Error Masking**: Sensitive errors are not exposed

## Integration Examples

### React Component

```jsx
import { useState, useEffect } from 'react';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setHistory(data.history);
        setMessage('');
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        Send
      </button>
      
      {history.map((msg, index) => (
        <div key={index} className={msg.role}>
          {msg.content}
        </div>
      ))}
    </div>
  );
}
```

### JavaScript Fetch

```javascript
async function askQuestion(question) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error asking question:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
```

## Best Practices

1. **Error Handling**: Always handle API errors gracefully
2. **Loading States**: Show loading indicators during requests
3. **Rate Limiting**: Implement client-side rate limiting
4. **Validation**: Validate input before sending requests
5. **Security**: Never expose API keys in client-side code
6. **Caching**: Cache responses when appropriate
7. **Retry Logic**: Implement exponential backoff for retries

## Support

For API support and questions:
- Create an issue on GitHub
- Contact: srisubspace@gmail.com
- Check the troubleshooting guide in the main README