"use client";

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

// Export the renderer component for direct use in React components
export const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code({ node, inline, className, children, ...props }) {
            const [isCopied, setIsCopied] = useState(false);
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            const handleCopy = () => {
              if (isCopied) return;
              navigator.clipboard.writeText(codeString).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              });
            };

            const customSyntaxStyle = {
              ...atomDark,
              'pre[class*="language-"]': {
                ...atomDark['pre[class*="language-"]'],
                backgroundColor: 'transparent',
                background: 'transparent',
                padding: '0',
                margin: '0',
                overflow: 'visible',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              },
            };

            return !inline && match ? (
              <div className="code-block-wrapper relative">
                <button
                  onClick={handleCopy}
                  className={`copy-button absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-white transition-colors ${
                    isCopied ? 'bg-green-600 hover:bg-green-500' : ''
                  }`}
                  title="Copy code"
                >
                  {isCopied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <div className="bg-neutral-800/80 rounded-lg p-4 my-4 overflow-x-auto border border-white/10">
                  <SyntaxHighlighter
                    style={customSyntaxStyle}
                    language={match[1]}
                    PreTag="pre"
                    wrapLines={true}
                    wrapLongLines={true}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <code className={`inline-code bg-neutral-800 text-green-400 px-2 py-1 rounded text-sm font-mono ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          h1({ node, className, children, ...props }) {
            return (
              <h1 
                className="text-2xl font-bold text-white mb-6 mt-8 first:mt-0 border-b border-white/20 pb-2"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ node, className, children, ...props }) {
            return (
              <h2 
                className="text-xl font-bold text-white mb-4 mt-6 first:mt-0"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ node, className, children, ...props }) {
            return (
              <h3 
                className="text-lg font-semibold text-white mb-3 mt-4 first:mt-0"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4({ node, className, children, ...props }) {
            return (
              <h4 
                className="text-base font-semibold text-white mb-2 mt-3"
                {...props}
              >
                {children}
              </h4>
            );
          },
          h5({ node, className, children, ...props }) {
            return (
              <h5 
                className="text-sm font-semibold text-white mb-2 mt-2"
                {...props}
              >
                {children}
              </h5>
            );
          },
          h6({ node, className, children, ...props }) {
            return (
              <h6 
                className="text-xs font-semibold text-white mb-2 mt-2"
                {...props}
              >
                {children}
              </h6>
            );
          },
          p({ node, className, children, ...props }) {
            return (
              <p className="text-white/80 mb-4 leading-relaxed" {...props}>
                {children}
              </p>
            );
          },
          strong({ node, className, children, ...props }) {
            return (
              <strong className="text-white font-semibold" {...props}>
                {children}
              </strong>
            );
          },
          em({ node, className, children, ...props }) {
            return (
              <em className="text-white/90 italic" {...props}>
                {children}
              </em>
            );
          },
          table({ node, className, children, ...props }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="table-auto w-full border-collapse bg-neutral-800/30 rounded-lg overflow-hidden" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, className, children, ...props }) {
            return (
              <thead className="bg-neutral-700/50" {...props}>
                {children}
              </thead>
            );
          },
          th({ node, className, children, ...props }) {
            return (
              <th 
                className="px-4 py-3 text-left text-sm font-semibold text-white border-b border-white/20"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, className, children, ...props }) {
            return (
              <td className="px-4 py-3 text-sm text-white/80 border-b border-white/10" {...props}>
                {children}
              </td>
            );
          },
          a({ node, className, children, href, ...props }) {
            return (
              <a 
                className="text-cyan-400 hover:text-cyan-300 underline transition-colors" 
                href={href}
                target="_blank" 
                rel="noopener noreferrer" 
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ node, className, children, ...props }) {
            return (
              <ul className="space-y-2 my-4 ml-4" {...props}>
                {children}
              </ul>
            );
          },
          ol({ node, className, children, ...props }) {
            return (
              <ol className="space-y-2 my-4 ml-4 list-decimal list-inside" {...props}>
                {children}
              </ol>
            );
          },
          li({ node, className, children, ...props }) {
            return (
              <li className="text-white/80 relative ml-4 before:content-['•'] before:absolute before:-left-4 before:text-cyan-400" {...props}>
                {children}
              </li>
            );
          },
          blockquote({ node, className, children, ...props }) {
            return (
              <blockquote 
                className="border-l-4 border-cyan-500 pl-4 py-2 my-4 text-white/80 bg-neutral-800/30 rounded-r-lg"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          img({ node, className, src, alt, ...props }) {
            // Handle both relative and absolute image paths
            const imageSrc = src?.startsWith('/') ? src : src?.startsWith('http') ? src : `/images/projects/${src}`;
            
            return (
              <div className="my-6 text-center">
                <img 
                  className="max-w-full h-auto rounded-lg border border-white/20 shadow-lg mx-auto hover:scale-[1.02] transition-transform duration-300" 
                  src={imageSrc}
                  alt={alt || 'Image'}
                  loading="lazy"
                  {...props} 
                />
                {alt && (
                  <p className="text-center text-white/60 text-sm mt-2 italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          hr({ node, className, ...props }) {
            return (
              <hr className="border-white/20 my-8" {...props} />
            );
          },
          // Handle HTML elements that might be in the markdown
          div({ node, className, children, ...props }) {
            return (
              <div className={className} {...props}>
                {children}
              </div>
            );
          },
          // Badge support for GitHub-style badges
          span({ node, className, children, ...props }) {
            // Handle GitHub badges and other span elements
            if (className?.includes('badge')) {
              return (
                <span className={`inline-block px-2 py-1 text-xs rounded-full bg-blue-600 text-white ${className}`} {...props}>
                  {children}
                </span>
              );
            }
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

// A simple function to check if content has markdown
export const hasMarkdown = (content) => {
  if (!content || typeof content !== 'string') return false;
  
  const markdownPatterns = [
    /```[\s\S]*?```/,         // Code blocks
    /\[.*?\]\(.*?\)/,         // Links
    /\*\*.+?\*\*/,            // Bold
    /\*.+?\*/,                // Italic
    /^#+\s+/m,                // Headers
    /^[-*+]\s+/m,             // Unordered lists
    /^\d+\.\s+/m,             // Ordered lists
    /^>\s+/m,                 // Blockquotes
    /!\[.*?\]\(.*?\)/,        // Images
    /\|.+\|.+\|/,             // Tables
    /^---$/m,                 // Horizontal rules
    /`[^`]+`/                 // Inline code
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}; 