#!/usr/bin/env node

/**
 * Render Server Launcher with Debug Info
 * This script helps debug server startup issues on Render
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Maria Intelligence Server...');
console.log('📍 Current working directory:', process.cwd());
console.log('📍 __dirname:', __dirname);

// Check possible server file locations
const possiblePaths = [
    'dist/server/index.js',
    './dist/server/index.js',
    'dist/index.js',
    './dist/index.js',
    path.join(__dirname, 'dist/server/index.js'),
    path.join(__dirname, 'dist/index.js')
];

console.log('\n🔍 Checking server file locations:');
possiblePaths.forEach((filePath, index) => {
    const exists = fs.existsSync(filePath);
    const absolutePath = path.resolve(filePath);
    console.log(`${index + 1}. ${filePath} -> ${exists ? '✅ EXISTS' : '❌ NOT FOUND'} (${absolutePath})`);
});

// Check dist directory structure
console.log('\n📁 Checking dist directory structure:');
try {
    if (fs.existsSync('dist')) {
        const distContents = fs.readdirSync('dist', { withFileTypes: true });
        distContents.forEach(item => {
            const type = item.isDirectory() ? '📁' : '📄';
            console.log(`   ${type} ${item.name}`);

            if (item.isDirectory()) {
                try {
                    const subContents = fs.readdirSync(path.join('dist', item.name));
                    subContents.forEach(subItem => {
                        console.log(`      📄 ${subItem}`);
                    });
                } catch (err) {
                    console.log(`      ❌ Could not read directory: ${err.message}`);
                }
            }
        });
    } else {
        console.log('❌ dist directory does not exist');
    }
} catch (err) {
    console.log('❌ Error reading dist directory:', err.message);
}

// Try to start the server with the first available path
console.log('\n🚀 Attempting to start server...');

async function startServer() {
    let serverStarted = false;

    for (const serverPath of possiblePaths) {
        if (fs.existsSync(serverPath)) {
            console.log(`✅ Found server at: ${serverPath}`);
            console.log('🔄 Starting server...');

            try {
                // Set production environment
                process.env.NODE_ENV = 'production';

                // Import and start the server
                await import(path.resolve(serverPath));
                serverStarted = true;
                console.log('✅ Server started successfully!');
                break;
            } catch (err) {
                console.error(`❌ Failed to start server with ${serverPath}:`, err.message);
                console.error('Stack trace:', err.stack);
            }
        }
    }

    if (!serverStarted) {
        console.error('💥 Could not start server - no valid server file found');
        console.error('📋 Available paths checked:', possiblePaths);
        process.exit(1);
    }
}

// Start the server
startServer().catch(err => {
    console.error('💥 Fatal error starting server:', err);
    console.error('Full error:', err);
    process.exit(1);
});