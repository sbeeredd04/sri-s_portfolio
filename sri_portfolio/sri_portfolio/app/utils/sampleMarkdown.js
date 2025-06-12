export const sampleMarkdownContent = `# Aether AI - Chat Multiverse

<div align="center">
  <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px;">
    <img src="./aether/public/aether.svg" alt="Aether AI Logo" width="80" height="80" />
    <h1 style="font-family: 'Major Mono Display', monospace; font-size: 48px; margin: 0; color: #333;">Aether</h1>
  </div>
  
  [![GitHub stars](https://img.shields.io/github/stars/sbeeredd04/Aether?style=for-the-badge)](https://github.com/sbeeredd04/Aether/stargazers)
  [![GitHub license](https://img.shields.io/github/license/sbeeredd04/Aether?style=for-the-badge)](https://github.com/sbeeredd04/Aether/blob/main/LICENSE)
  [![GitHub issues](https://img.shields.io/github/issues/sbeeredd04/Aether?style=for-the-badge)](https://github.com/sbeeredd04/Aether/issues)
  [![GitHub contributors](https://img.shields.io/github/contributors/sbeeredd04/Aether?style=for-the-badge)](https://github.com/sbeeredd04/Aether/graphs/contributors)

  **Transform your AI conversations into explorable trees of thought with the Chat Multiverse**
  
  [**LIVE DEMO**](https://aether.sriujjwalreddy.com) • [**DOCUMENTATION**](./docs/README.md) • [**REPORT BUG**](https://github.com/sbeeredd04/Aether/issues) • [**FEATURE REQUEST**](https://github.com/sbeeredd04/Aether/issues)
  
  **Developed by [Sri Ujjwal Reddy](https://github.com/sbeeredd04) | [Portfolio](https://sriujjwalreddy.com)**
</div>

---

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Support](#support)

---

## About

Aether AI - Chat Multiverse revolutionizes how you interact with artificial intelligence by transforming linear conversations into visual, explorable trees. Enter a multiverse where every conversation branches into infinite possibilities. Instead of losing context in long chat threads, you can:

- **Branch conversations** from any point to explore different ideas
- **Navigate visually** through your conversation history across the multiverse
- **Compare responses** from multiple AI models side-by-side
- **Never lose context** with persistent conversation trees
- **Experience modern design** with Major Mono Display typography and glass morphism UI

![Aether AI Demo](./assets/demo.gif)

## Key Features

### Visual Conversation Trees
Transform linear chats into explorable graphs. Every conversation becomes a visual journey you can navigate and explore.

### Multiple AI Models
- Gemini 2.0 Flash
- Thinking models
- Image generation capabilities
- Web-grounded responses

### Infinite Branching
Create unlimited conversation branches from any point. Explore different answers without losing your original thread.

### Rich Media Support
- Upload images, audio, and files
- Generate images directly in conversations
- Full multimedia AI interactions

### Web-Grounded Responses
Get answers backed by real-time web search. Perfect for research, fact-checking, and current events.

### Developer Friendly
- Full markdown support with syntax highlighting
- One-click copy functionality for code blocks
- Automatic session persistence
- Modern typography with Major Mono Display and Space Grotesk

### Modern Design System
- **Typography**: Major Mono Display for headings, Space Grotesk for readability
- **Theme**: Dark mode with purple/blue gradient accents
- **UI**: Glass morphism effects with backdrop blur
- **Logo**: Custom metallic gradient SVG design

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Google AI API key (for Gemini models)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/sbeeredd04/Aether.git
   cd Aether/aether
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your API keys to \`.env.local\`:
   \`\`\`env
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Usage

1. **Start a conversation**: Type your question or prompt in the input field
2. **Create branches**: Click the "+" button on any node to create a new branch
3. **Navigate**: Use the visual tree to navigate between different conversation paths
4. **View context**: Check the sidebar for full conversation history

### Advanced Features

- **Model Selection**: Choose different AI models for different types of responses
- **Image Upload**: Drag and drop images for visual analysis
- **Web Search**: Toggle web grounding for real-time information
- **Export**: Save your conversation trees for future reference

For detailed usage instructions, see our [User Guide](./docs/USER_GUIDE.md).

## Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Visualization**: React Flow
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **AI Integration**: Google Generative AI
- **Markdown**: React Markdown with syntax highlighting

### Project Structure

\`\`\`
aether/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx        # Landing page
│   │   └── workspace/      # Main application
│   ├── components/         # React components
│   │   ├── ui/            # UI components
│   │   ├── nodes/         # Node components
│   │   └── ...
│   ├── store/             # Zustand state management
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── public/                # Static assets
├── docs/                 # Documentation
└── ...
\`\`\`

For detailed architecture information, see our [Architecture Guide](./docs/ARCHITECTURE.md).

## Code Examples

### React Component Example

\`\`\`jsx
import React from 'react';
import { MarkdownRenderer } from './components/MarkdownRenderer';

const ProjectModal = ({ project }) => {
  return (
    <div className="modal-content">
      <h2>{project.title}</h2>
      <MarkdownRenderer content={project.description} />
    </div>
  );
};

export default ProjectModal;
\`\`\`

### Python API Integration

\`\`\`python
import requests
import json

def get_ai_response(prompt, model="gemini-2.0-flash"):
    response = requests.post("/api/chat", {
        "message": prompt,
        "model": model,
        "temperature": 0.7
    })
    return response.json()

# Example usage
result = get_ai_response("Explain quantum computing")
print(result["response"])
\`\`\`

### Mathematical Equations

You can also include LaTeX-style mathematical equations:

Inline math: \\( E = mc^2 \\)

Block math:
\\[
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
\\]

### Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Visual Trees | Transform conversations into explorable graphs | ✅ Complete |
| Multi-Model | Support for multiple AI models | ✅ Complete |
| Web Search | Real-time web-grounded responses | ✅ Complete |
| Collaboration | Real-time multi-user editing | 🚧 In Progress |
| Mobile App | Native mobile applications | 📋 Planned |

### Lists and Checkboxes

**Key Features:**
- [x] Visual conversation trees
- [x] Multiple AI model support
- [x] Rich media uploads
- [x] Syntax highlighting
- [ ] Real-time collaboration
- [ ] Voice conversations
- [ ] Mobile applications

**Supported Languages:**
1. JavaScript/TypeScript
2. Python
3. Java
4. C++
5. Rust
6. Go

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting pull requests.

> **Note**: Before contributing, make sure to read our code style guidelines and run the test suite.

### Development Workflow

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Make your changes
4. Run tests: \`npm test\`
5. Commit your changes: \`git commit -m 'Add amazing feature'\`
6. Push to the branch: \`git push origin feature/amazing-feature\`
7. Open a Pull Request

## Roadmap

### Current Version (v0.1.0)
- **COMPLETED** Visual conversation trees
- **COMPLETED** Multiple AI models
- **COMPLETED** Web-grounded responses
- **COMPLETED** Image generation
- **COMPLETED** Rich markdown support

### Upcoming Features
- **PLANNED** Real-time collaboration
- **PLANNED** Voice conversations
- **PLANNED** Mobile app
- **PLANNED** Plugin system
- **PLANNED** Advanced export options
- **PLANNED** Team workspaces

---

<div align="center">
  <p style="font-family: 'Space Grotesk', sans-serif;">Made with <span style="color: #e74c3c;">♥</span> by the <span style="font-family: 'Major Mono Display', monospace;">Aether</span> AI team</p>
  
  [Website](https://aether.sriujjwalreddy.com) • [GitHub](https://github.com/sbeeredd04/Aether)
</div>
`;

// You can use this in your project data like this:
export const aetherProject = {
  title: "Aether AI - Chat Multiverse",
  description: "Transform your AI conversations into explorable trees of thought",
  detailedContent: sampleMarkdownContent,
  technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Zustand", "React Flow"],
  github: "https://github.com/sbeeredd04/Aether",
  href: "https://aether.sriujjwalreddy.com",
  youtube: "your-video-id-here",
  video: "/videos/aether-demo.mp4"
}; 