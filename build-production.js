#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production application...');

try {
  // Build frontend
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });

  // Build backend with proper ESM handling
  console.log('Building backend...');
  execSync(`esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:drizzle-kit --external:tsx --external:@types/*`, { stdio: 'inherit' });

  console.log('Production build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}