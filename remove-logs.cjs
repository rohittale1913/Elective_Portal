const fs = require('fs');
const path = require('path');

// Remove console statements more carefully
function removeConsoleLogs(content) {
  // Remove single-line console statements
  content = content.replace(/^\s*console\.(log|warn|error|info|debug)\([^;]*\);?\s*$/gm, '');
  
  // Remove console statements that span multiple lines (more aggressive)
  content = content.replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '');
  
  // Clean up extra blank lines (but preserve some spacing)
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeConsoleLogs(content);
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✅ Cleaned: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
console.log('🧹 Removing console statements...\n');

const srcPath = path.join(__dirname, 'src');
const files = walkDir(srcPath);

let cleanedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    cleanedCount++;
  }
});

console.log(`\n✨ Complete! Cleaned ${cleanedCount} files.`);
