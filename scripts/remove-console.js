#!/usr/bin/env node

/**
 * Remove all console statements from the project
 * This script removes console.log, console.error, console.warn, console.info, console.debug
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = __dirname;

// Patterns to match files
const filePatterns = [
  'src/**/*.tsx',
  'src/**/*.ts',
  'src/**/*.jsx',
  'src/**/*.js',
  'server/**/*.js',
  'simple-server.cjs'
];

console.log('🧹 Removing console statements from project...\n');

let totalFilesProcessed = 0;
let totalStatementsRemoved = 0;

// Regular expression to match console statements (more robust)
const consoleRegex = /console\.(log|error|warn|info|debug)\([^)]*\);?\s*\n?/gm;

filePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: projectRoot, absolute: true });
  
  files.forEach(filePath => {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      
      // Count console statements
      const matches = content.match(consoleRegex);
      const count = matches ? matches.length : 0;
      
      if (count > 0) {
        // Remove console statements
        content = content.replace(consoleRegex, '');
        
        // Clean up excessive blank lines (max 2 consecutive)
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // Write back to file
        fs.writeFileSync(filePath, content, 'utf8');
        
        totalFilesProcessed++;
        totalStatementsRemoved += count;
        
        const relativePath = path.relative(projectRoot, filePath);
        console.log(`✅ ${relativePath} - Removed ${count} console statements`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });
});

console.log(`\n✨ Complete!`);
console.log(`📊 Processed ${totalFilesProcessed} files`);
console.log(`🗑️  Removed ${totalStatementsRemoved} console statements total`);
