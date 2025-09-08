#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple data URL for a construction-themed PNG icon
const createPNGDataURL = (size, maskable = false) => {
  // This is a base64-encoded 1x1 transparent PNG - in production you'd use proper icon conversion
  // For now, we'll create simple canvas-based icons using Node.js or use SVG directly
  const canvas = require('canvas');
  const { createCanvas } = canvas;
  
  const canvasSize = size;
  const ctx = createCanvas(canvasSize, canvasSize).getContext('2d');
  
  // Background
  const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  gradient.addColorStop(0, '#1FB8CD');
  gradient.addColorStop(1, '#0d9488');
  
  if (maskable) {
    // Circle for maskable icons
    ctx.beginPath();
    ctx.arc(canvasSize/2, canvasSize/2, canvasSize/2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  } else {
    // Rounded rectangle for regular icons
    const radius = canvasSize * 0.2;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvasSize, canvasSize, radius);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Simple building silhouette
  ctx.fillStyle = '#ffffff';
  const buildingScale = 0.6;
  const buildingOffset = canvasSize * (1 - buildingScale) / 2;
  
  // Three buildings
  ctx.fillRect(buildingOffset + canvasSize * 0.1, buildingOffset + canvasSize * 0.3, canvasSize * 0.15, canvasSize * 0.4);
  ctx.fillRect(buildingOffset + canvasSize * 0.3, buildingOffset + canvasSize * 0.35, canvasSize * 0.15, canvasSize * 0.35);
  ctx.fillRect(buildingOffset + canvasSize * 0.5, buildingOffset + canvasSize * 0.25, canvasSize * 0.15, canvasSize * 0.45);
  
  // Windows
  ctx.fillStyle = '#1FB8CD';
  const windowSize = canvasSize * 0.03;
  const windowOffsetY = buildingOffset + canvasSize * 0.4;
  
  // Building 1 windows
  ctx.fillRect(buildingOffset + canvasSize * 0.12, windowOffsetY, windowSize, windowSize);
  ctx.fillRect(buildingOffset + canvasSize * 0.18, windowOffsetY, windowSize, windowSize);
  ctx.fillRect(buildingOffset + canvasSize * 0.12, windowOffsetY + canvasSize * 0.1, windowSize, windowSize);
  ctx.fillRect(buildingOffset + canvasSize * 0.18, windowOffsetY + canvasSize * 0.1, windowSize, windowSize);
  
  return ctx.canvas.toBuffer('image/png');
};

// Check if canvas is available
let canvasAvailable = false;
try {
  require('canvas');
  canvasAvailable = true;
} catch (e) {
  console.log('📝 Canvas module not available, creating simple placeholder PNGs');
}

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (canvasAvailable) {
  iconSizes.forEach(size => {
    try {
      // Regular icons
      const pngBuffer = createPNGDataURL(size, false);
      fs.writeFileSync(path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}.png`), pngBuffer);
      console.log(`✓ Generated icon-${size}x${size}.png`);
      
      // Maskable icons (only for 192 and 512)
      if (size === 192 || size === 512) {
        const maskablePNG = createPNGDataURL(size, true);
        fs.writeFileSync(path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}-maskable.png`), maskablePNG);
        console.log(`✓ Generated icon-${size}x${size}-maskable.png`);
      }
    } catch (error) {
      console.log(`⚠️  Could not generate PNG for ${size}x${size}: ${error.message}`);
    }
  });
} else {
  // Create simple placeholder PNG files by copying a basic structure
  console.log('Creating placeholder PNG files...');
  
  iconSizes.forEach(size => {
    // Create minimal PNG placeholder content
    const placeholder = 'Placeholder PNG content - replace with actual icons in production';
    
    try {
      // For development purposes, copy the SVG files as .png (browsers can handle SVG icons)
      const svgPath = path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}.svg`);
      const pngPath = path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}.png`);
      
      if (fs.existsSync(svgPath)) {
        fs.copyFileSync(svgPath, pngPath);
        console.log(`✓ Created placeholder icon-${size}x${size}.png`);
      }
      
      // Maskable icons
      if (size === 192 || size === 512) {
        const maskableSvgPath = path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}-maskable.svg`);
        const maskablePngPath = path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}-maskable.png`);
        
        if (fs.existsSync(maskableSvgPath)) {
          fs.copyFileSync(maskableSvgPath, maskablePngPath);
          console.log(`✓ Created placeholder icon-${size}x${size}-maskable.png`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not create placeholder for ${size}x${size}: ${error.message}`);
    }
  });
}

// Create shortcut icons
const shortcutIcons = ['dashboard', 'project', 'inventory', 'finance'];
shortcutIcons.forEach(name => {
  try {
    const svgPath = path.join(__dirname, 'assets', 'icons', `shortcut-${name}.svg`);
    const pngPath = path.join(__dirname, 'assets', 'icons', `shortcut-${name}.png`);
    
    if (fs.existsSync(svgPath)) {
      fs.copyFileSync(svgPath, pngPath);
      console.log(`✓ Created placeholder shortcut-${name}.png`);
    }
  } catch (error) {
    console.log(`⚠️  Could not create shortcut placeholder for ${name}: ${error.message}`);
  }
});

console.log('\n🎉 PWA icon placeholders created successfully!');
console.log('📝 Note: For production, use proper image conversion tools or design software');
console.log('   to create high-quality PNG icons from the SVG templates.');
