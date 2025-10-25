export const parseMarkdown = (markdown) => {
  if (!markdown) return '';

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mb-3 mt-6 first:mt-0">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mb-4 mt-8 first:mt-0">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-6 mt-10 first:mt-0">$1</h1>')
    
    // Bold text
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
    
    // Italic text
    .replace(/\*(.*)\*/gim, '<em class="text-white/90 italic">$1</em>')
    
    // Code blocks (triple backticks)
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-neutral-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm text-green-400 font-mono">$1</code></pre>')
    
    // Inline code
    .replace(/`([^`]*)`/gim, '<code class="bg-neutral-800 text-green-400 px-2 py-1 rounded text-sm font-mono">$1</code>')
    
    // Images with support for pipeline/example images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (match, alt, src) => {
      // Check if it's a local project image (starts with /projects/ or /images/)
      const imageSrc = src.startsWith('/') ? src : `/images/projects/${src}`;
      return `<div class="my-6">
        <img src="${imageSrc}" alt="${alt}" class="w-full max-w-2xl mx-auto rounded-lg border border-white/20 shadow-lg" loading="lazy" />
        ${alt ? `<p class="text-center text-white/60 text-sm mt-2 italic">${alt}</p>` : ''}
      </div>`;
    })
    
    // Links
    .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline transition-colors">$1</a>')
    
    // Lists (unordered)
    .replace(/^\- (.*$)/gim, '<li class="text-white/80 mb-2 ml-4 relative before:content-[\'•\'] before:absolute before:-left-4 before:text-cyan-400">$1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul class="my-4">$1</ul>')
    
    // Lists (ordered)
    .replace(/^\d+\. (.*$)/gim, '<li class="text-white/80 mb-2 ml-6">$1</li>')
    
    // Checkboxes
    .replace(/- \[ \] (.*$)/gim, '<li class="text-white/80 mb-2 ml-4 flex items-center"><input type="checkbox" disabled class="mr-2 opacity-50" /> $1</li>')
    .replace(/- \[x\] (.*$)/gim, '<li class="text-white/80 mb-2 ml-4 flex items-center"><input type="checkbox" checked disabled class="mr-2 opacity-50" /> $1</li>')
    
    // Tables (basic support)
    .replace(/\|(.+)\|/gim, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);
      const isHeader = match.includes('---');
      if (isHeader) return ''; // Skip separator rows
      
      const cellTags = cells.map(cell => 
        cells.indexOf(cell) === 0 && !match.includes('**') 
          ? `<th class="text-left text-white font-semibold p-3 border-b border-white/20">${cell}</th>`
          : `<td class="text-white/80 p-3 border-b border-white/10">${cell}</td>`
      ).join('');
      
      return `<tr class="hover:bg-white/5 transition-colors">${cellTags}</tr>`;
    })
    .replace(/(<tr.*<\/tr>)/s, '<table class="w-full my-6 border-collapse bg-neutral-800/30 rounded-lg overflow-hidden">$1</table>')
    
    // Paragraphs (convert double line breaks to paragraphs)
    .replace(/\n\n/gim, '</p><p class="text-white/80 mb-4 leading-relaxed">')
    
    // Line breaks
    .replace(/\n/gim, '<br>')
    
    // Emoji shortcodes (basic support)
    .replace(/:rocket:/g, '🚀')
    .replace(/:star:/g, '⭐')
    .replace(/:fire:/g, '🔥')
    .replace(/:thumbsup:/g, '👍')
    .replace(/:checkmark:/g, '✅')
    .replace(/:warning:/g, '⚠️')
    .replace(/:info:/g, 'ℹ️');

  // Wrap in paragraph tags if not already wrapped
  if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>')) {
    html = `<p class="text-white/80 mb-4 leading-relaxed">${html}</p>`;
  } else if (!html.startsWith('<')) {
    html = `<p class="text-white/80 mb-4 leading-relaxed">${html}`;
  }

  return html;
};

export const renderMarkdown = (markdown) => {
  const html = parseMarkdown(markdown);
  return { __html: html };
}; 