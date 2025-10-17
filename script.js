// Helper function to parse data URLs
function parseDataUrl(url) {
  if (!url.startsWith('data:')) {
    return null;
  }
  
  const match = url.match(/^data:([^;]+)(;base64)?,(.*)$/);
  if (!match) {
    return null;
  }
  
  const mime = match[1];
  const isBase64 = !!match[2];
  const payload = match[3];
  
  let text = '';
  if (isBase64) {
    try {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      console.error('Failed to decode base64 data URL');
      return null;
    }
  } else {
    try {
      text = decodeURIComponent(payload);
    } catch (e) {
      console.error('Failed to decode URL-encoded data');
      return null;
    }
  }
  
  return { mime, isBase64, text };
}

// Function to process attachments
async function processAttachment(url) {
  // Handle data URLs
  if (url.startsWith('data:')) {
    const parsed = parseDataUrl(url);
    if (parsed && parsed.text) {
      return parsed.text;
    } else {
      throw new Error('Failed to parse data URL');
    }
  }
  
  // Handle regular URLs
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching attachment:', error);
    throw error;
  }
}

// Tab switching functionality
function setupTabs(markdownText) {
  const htmlTab = document.getElementById('tab-html');
  const sourceTab = document.getElementById('tab-source');
  const outputElement = document.getElementById('markdown-output');
  const sourceElement = document.getElementById('markdown-source');
  
  // Show the markdown source in the source tab
  sourceElement.textContent = markdownText;
  
  // Add event listeners for tab switching
  htmlTab.addEventListener('click', () => {
    htmlTab.classList.add('active');
    sourceTab.classList.remove('active');
    outputElement.style.display = 'block';
    sourceElement.style.display = 'none';
  });
  
  sourceTab.addEventListener('click', () => {
    sourceTab.classList.add('active');
    htmlTab.classList.remove('active');
    sourceElement.style.display = 'block';
    outputElement.style.display = 'none';
  });
}

// Main function to convert markdown to HTML
async function convertMarkdown() {
  const outputElement = document.getElementById('markdown-output');
  
  try {
    // Get the attachment URL from the context
    const attachments = [
      {
        "name": "input.md",
        "url": "data:text/markdown;base64,aGVsbG8KIyBUaXRsZQ=="
      }
    ];
    
    if (!attachments || attachments.length === 0) {
      throw new Error('No attachments provided');
    }
    
    // Find the markdown file (either named input.md or the first markdown file)
    let markdownAttachment = attachments.find(att => att.name === 'input.md');
    if (!markdownAttachment) {
      markdownAttachment = attachments.find(att => att.url.includes('markdown') || att.url.endsWith('.md'));
    }
    if (!markdownAttachment) {
      markdownAttachment = attachments[0]; // fallback to first attachment
    }
    
    // Process the markdown content
    const markdownText = await processAttachment(markdownAttachment.url);
    
    // Set Marked.js options
    marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    });
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(markdownText);
    
    // Render in the output element
    outputElement.innerHTML = htmlContent;
    
    // Setup tab switching
    setupTabs(markdownText);
  } catch (error) {
    console.error('Error converting markdown:', error);
    outputElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', convertMarkdown);