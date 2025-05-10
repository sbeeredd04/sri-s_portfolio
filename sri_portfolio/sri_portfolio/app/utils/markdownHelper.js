export const renderMarkdown = (text) => {
  if (typeof text !== 'string' || !text) {
    return '';
  }

  // Process line by line
  const rawLines = text.split('\n');
  let htmlOutput = '';
  let inList = false;

  for (const line of rawLines) {
    // Basic HTML escaping for the line itself before markdown processing
    // This is not a comprehensive sanitizer.
    let processedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Unordered list items: - item, * item, or + item (allowing for leading spaces)
    const listItemMatch = processedLine.match(/^(\s*[-*+]\s+)(.*)/);

    if (listItemMatch) {
      if (!inList) {
        htmlOutput += '<ul>';
        inList = true;
      }
      let itemContent = listItemMatch[2];
      // Apply bold and italics to item content
      itemContent = itemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
      itemContent = itemContent.replace(/_(.+?)_/g, '<em>$1</em>'); // Italics (underscore)
      itemContent = itemContent.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italics (asterisk)
      htmlOutput += `<li>${itemContent}</li>`;
    } else {
      if (inList) {
        htmlOutput += '</ul>';
        inList = false;
      }
      // Apply bold and italics to non-list lines
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
      processedLine = processedLine.replace(/_(.+?)_/g, '<em>$1</em>'); // Italics (underscore)
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italics (asterisk)
      
      if (processedLine.trim() === '') {
        // If it was an empty line in markdown, treat as a paragraph break.
        // Avoid adding <p></p> for genuinely empty lines if they don't follow content.
        if (htmlOutput.endsWith('</p>') || htmlOutput.endsWith('</ul>')) {
            htmlOutput += '<br />';
        }
      } else {
        htmlOutput += `<p>${processedLine}</p>`;
      }
    }
  }

  if (inList) { // Close list if the text ends with list items
    htmlOutput += '</ul>';
  }
  
  // Basic cleanup: remove empty paragraphs that might result from consecutive newlines
  htmlOutput = htmlOutput.replace(/<p>\s*<\/p>/g, '');
  // Remove <p> tags around <ul>
  htmlOutput = htmlOutput.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');


  return htmlOutput;
}; 