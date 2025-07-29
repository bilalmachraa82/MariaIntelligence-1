#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a fallback motion component
const motionFallback = `// Fallback for framer-motion during build
export const motion = {
  div: ({ children, className, ...props }) => {
    return React.createElement('div', { className, ...props }, children);
  },
  section: ({ children, className, ...props }) => {
    return React.createElement('section', { className, ...props }, children);
  },
  span: ({ children, className, ...props }) => {
    return React.createElement('span', { className, ...props }, children);
  },
  p: ({ children, className, ...props }) => {
    return React.createElement('p', { className, ...props }, children);
  },
  h1: ({ children, className, ...props }) => {
    return React.createElement('h1', { className, ...props }, children);
  },
  h2: ({ children, className, ...props }) => {
    return React.createElement('h2', { className, ...props }, children);
  },
  h3: ({ children, className, ...props }) => {
    return React.createElement('h3', { className, ...props }, children);
  },
  button: ({ children, className, ...props }) => {
    return React.createElement('button', { className, ...props }, children);
  }
};
`;

// Write fallback file
fs.writeFileSync('client/src/lib/motion-fallback.ts', motionFallback);

// Find and fix files
function findAndFixMotionImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAndFixMotionImports(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('from "framer-motion"')) {
        console.log(`Fixing: ${fullPath}`);
        content = content.replace(
          /import.*from "framer-motion";?/g,
          'import { motion } from "@/lib/motion-fallback";'
        );
        fs.writeFileSync(fullPath, content);
      }
    }
  });
}

console.log('Fixing framer-motion imports...');
findAndFixMotionImports('client/src');
console.log('Done!');