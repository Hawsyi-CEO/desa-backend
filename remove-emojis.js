const fs = require('fs');
const path = require('path');

// Emoji yang akan dihapus
const emojiList = [
  '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', 
  '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', ''
];

// Create regex pattern untuk remove emoji + space setelahnya
const emojiPattern = new RegExp(`(${emojiList.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*`, 'g');

function removeEmojisFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove emojis from console.log statements
    content = content.replace(emojiPattern, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[CLEANED] ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[ERROR] ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir, extensions = ['.js', '.jsx']) {
  let cleaned = 0;
  let total = 0;

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
          walkDir(filePath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          total++;
          if (removeEmojisFromFile(filePath)) {
            cleaned++;
          }
        }
      }
    }
  }

  walkDir(dir);
  return { cleaned, total };
}

// Main execution
const backendDir = path.join(__dirname, '.');
const frontendDir = path.join(__dirname, '..', 'frontend', 'src');

console.log('='.repeat(60));
console.log('REMOVING EMOJIS FROM PROJECT');
console.log('='.repeat(60));

console.log('\n[BACKEND]');
const backendStats = processDirectory(backendDir, ['.js']);

console.log('\n[FRONTEND]');
const frontendStats = processDirectory(frontendDir, ['.js', '.jsx']);

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Backend: ${backendStats.cleaned}/${backendStats.total} files cleaned`);
console.log(`Frontend: ${frontendStats.cleaned}/${frontendStats.total} files cleaned`);
console.log(`Total: ${backendStats.cleaned + frontendStats.cleaned}/${backendStats.total + frontendStats.total} files cleaned`);
console.log('\n[DONE] All emojis removed!');
