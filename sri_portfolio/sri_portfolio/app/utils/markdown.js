export const parseMarkdown = (markdown) => {
  if (!markdown) return '';

  let html = markdown;

  // Code blocks (triple backticks) with language support - MUST BE FIRST
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
    const language = lang || 'text';
    return `<pre class="bg-neutral-900 rounded-lg p-4 my-6 overflow-x-auto border border-white/10 shadow-lg"><code class="text-sm text-green-400 font-mono language-${language}">${code.trim()}</code></pre>`;
  });

  // Inline code - BEFORE other inline formatting
  html = html.replace(/`([^`]+)`/g, '<code class="bg-neutral-800/80 text-cyan-400 px-2 py-0.5 rounded text-sm font-mono border border-white/10">$1</code>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="border-t border-white/20 my-8" />');
  html = html.replace(/^\*\*\*$/gim, '<hr class="border-t border-white/20 my-8" />');
  html = html.replace(/^___$/gim, '<hr class="border-t border-white/20 my-8" />');

  // Blockquotes
  html = html.replace(/^> (.+)$/gim, '<blockquote class="border-l-4 border-cyan-500 pl-4 py-2 my-4 bg-neutral-800/30 text-white/90 italic">$1</blockquote>');

  // Headers - Order matters (### before ## before #)
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-cyan-300 mb-2 mt-4 first:mt-0">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-cyan-300 mb-3 mt-6 first:mt-0">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mb-4 mt-8 first:mt-0 border-b border-white/10 pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-6 mt-10 first:mt-0 border-b-2 border-cyan-500 pb-3">$1</h1>');

  // Bold and italic combined (***text*** or ___text___)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-white font-bold italic">$1</strong>');
  html = html.replace(/___(.+?)___/g, '<strong class="text-white font-bold italic">$1</strong>');

  // Bold text (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong class="text-white font-semibold">$1</strong>');

  // Italic text (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em class="text-white/90 italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="text-white/90 italic">$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<del class="text-white/60 line-through">$1</del>');

  // Images with support for local and external images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    const imageSrc = src.startsWith('http') ? src : (src.startsWith('/') ? src : `/images/${src}`);
    return `<div class="my-6 flex flex-col items-center">
      <img src="${imageSrc}" alt="${alt}" class="w-full max-w-3xl mx-auto rounded-lg border border-white/20 shadow-2xl hover:shadow-cyan-500/20 transition-shadow" loading="lazy" />
      ${alt ? `<p class="text-center text-white/60 text-sm mt-3 italic max-w-2xl">${alt}</p>` : ''}
    </div>`;
  });

  // Links with better styling
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 hover:decoration-cyan-400 transition-all">$1</a>');

  // Task lists / Checkboxes
  html = html.replace(/^- \[x\] (.+)$/gim, '<li class="text-white/80 mb-2 flex items-start"><span class="mr-2 text-green-400">✓</span><span class="flex-1">$1</span></li>');
  html = html.replace(/^- \[ \] (.+)$/gim, '<li class="text-white/80 mb-2 flex items-start"><span class="mr-2 text-white/40">☐</span><span class="flex-1">$1</span></li>');

  // Unordered lists (- or * or +)
  html = html.replace(/^[\-\*\+] (.+)$/gim, '<li class="text-white/80 mb-2 ml-5 relative before:content-[\'\'] before:absolute before:left-[-1.25rem] before:top-[0.6rem] before:w-1.5 before:h-1.5 before:rounded-full before:bg-cyan-400">$1</li>');

  // Ordered lists (1. 2. 3.)
  html = html.replace(/^(\d+)\. (.+)$/gim, '<li class="text-white/80 mb-2 ml-6 pl-2" value="$1">$2</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li class="text-white\/80[^>]*>.*<\/li>\s*)+/gs, (match) => {
    if (match.includes('value=')) {
      return `<ol class="my-4 space-y-1 list-decimal list-inside">${match}</ol>`;
    }
    return `<ul class="my-4 space-y-1">${match}</ul>`;
  });

  // Tables (enhanced support)
  const tableRegex = /(\|.+\|\n)+/g;
  html = html.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n');
    const headers = rows[0].split('|').map(h => h.trim()).filter(h => h);
    const isValidTable = rows.length > 1 && rows[1].includes('---');
    
    if (!isValidTable) return match;

    const headerHTML = `<thead><tr>${headers.map(h => 
      `<th class="text-left text-white font-semibold p-3 border-b-2 border-cyan-500/50 bg-neutral-800/50">${h}</th>`
    ).join('')}</tr></thead>`;

    const bodyRows = rows.slice(2).map(row => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      return `<tr class="hover:bg-white/5 transition-colors">${cells.map(c => 
        `<td class="text-white/80 p-3 border-b border-white/10">${c}</td>`
      ).join('')}</tr>`;
    }).join('');

    return `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse bg-neutral-800/30 rounded-lg overflow-hidden shadow-lg">${headerHTML}<tbody>${bodyRows}</tbody></table></div>`;
  });

  // Emoji shortcodes (extended support)
  const emojiMap = {
    ':rocket:': '🚀', ':star:': '⭐', ':fire:': '🔥', ':thumbsup:': '👍', 
    ':checkmark:': '✅', ':warning:': '⚠️', ':info:': 'ℹ️', ':bulb:': '💡',
    ':tada:': '🎉', ':heart:': '❤️', ':sparkles:': '✨', ':zap:': '⚡',
    ':computer:': '💻', ':book:': '📖', ':wrench:': '🔧', ':gear:': '⚙️'
  };
  Object.entries(emojiMap).forEach(([code, emoji]) => {
    html = html.replace(new RegExp(code, 'g'), emoji);
  });

  // Paragraphs - Convert double line breaks to paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="text-white/80 mb-4 leading-relaxed text-base">');

  // Single line breaks
  html = html.replace(/\n/g, '<br />');

  // Wrap in paragraph if needed
  if (!html.match(/^<(h[1-6]|div|ul|ol|pre|blockquote|table)/)) {
    html = `<p class="text-white/80 mb-4 leading-relaxed text-base">${html}</p>`;
  }

  return html;
};

export const renderMarkdown = (markdown) => {
  const html = parseMarkdown(markdown);
  return { __html: html };
}; 