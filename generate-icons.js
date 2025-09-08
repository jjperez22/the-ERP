#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Construction ERP SVG icon template
const createSVGIcon = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0; // 10% padding for maskable icons
  const iconSize = size - (padding * 2);
  const iconOffset = padding;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1FB8CD"/>
      <stop offset="100%" style="stop-color:#0d9488"/>
    </linearGradient>
    <linearGradient id="building-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#f8fafc"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  ${maskable ? 
    `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#bg-gradient)"/>` : 
    `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg-gradient)"/>`
  }
  
  <!-- Construction building icon -->
  <g transform="translate(${iconOffset + iconSize * 0.2}, ${iconOffset + iconSize * 0.15})">
    <!-- Main building -->
    <rect x="0" y="${iconSize * 0.25}" width="${iconSize * 0.25}" height="${iconSize * 0.6}" fill="url(#building-gradient)" stroke="#ffffff" stroke-width="2"/>
    
    <!-- Second building -->
    <rect x="${iconSize * 0.3}" y="${iconSize * 0.35}" width="${iconSize * 0.25}" height="${iconSize * 0.5}" fill="url(#building-gradient)" stroke="#ffffff" stroke-width="2"/>
    
    <!-- Third building -->
    <rect x="${iconSize * 0.6}" y="${iconSize * 0.15}" width="${iconSize * 0.25}" height="${iconSize * 0.7}" fill="url(#building-gradient)" stroke="#ffffff" stroke-width="2"/>
    
    <!-- Windows on buildings -->
    <rect x="${iconSize * 0.05}" y="${iconSize * 0.35}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.14}" y="${iconSize * 0.35}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.05}" y="${iconSize * 0.5}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.14}" y="${iconSize * 0.5}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    
    <rect x="${iconSize * 0.35}" y="${iconSize * 0.45}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.44}" y="${iconSize * 0.45}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.35}" y="${iconSize * 0.6}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    
    <rect x="${iconSize * 0.65}" y="${iconSize * 0.25}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.74}" y="${iconSize * 0.25}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.65}" y="${iconSize * 0.4}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.74}" y="${iconSize * 0.4}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.65}" y="${iconSize * 0.55}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    <rect x="${iconSize * 0.74}" y="${iconSize * 0.55}" width="${iconSize * 0.06}" height="${iconSize * 0.08}" fill="#1FB8CD" opacity="0.7"/>
    
    <!-- Crane -->
    <line x1="${iconSize * 0.1}" y1="${iconSize * 0.25}" x2="${iconSize * 0.1}" y2="${iconSize * 0.05}" stroke="#ffffff" stroke-width="3"/>
    <line x1="${iconSize * 0.1}" y1="${iconSize * 0.05}" x2="${iconSize * 0.4}" y2="${iconSize * 0.05}" stroke="#ffffff" stroke-width="3"/>
    <line x1="${iconSize * 0.1}" y1="${iconSize * 0.1}" x2="${iconSize * 0.35}" y2="${iconSize * 0.05}" stroke="#ffffff" stroke-width="2"/>
    
    <!-- Crane hook -->
    <circle cx="${iconSize * 0.35}" cy="${iconSize * 0.12}" r="${iconSize * 0.015}" fill="#ffffff"/>
    <line x1="${iconSize * 0.35}" y1="${iconSize * 0.05}" x2="${iconSize * 0.35}" y2="${iconSize * 0.12}" stroke="#ffffff" stroke-width="1"/>
  </g>
</svg>`;
};

// Create favicon
const createFavicon = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="favicon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1FB8CD"/>
      <stop offset="100%" style="stop-color:#0d9488"/>
    </linearGradient>
  </defs>
  
  <rect width="32" height="32" rx="6" fill="url(#favicon-gradient)"/>
  
  <!-- Simplified building silhouette -->
  <g transform="translate(4, 4)">
    <rect x="0" y="8" width="6" height="16" fill="#ffffff" opacity="0.9"/>
    <rect x="8" y="10" width="6" height="14" fill="#ffffff" opacity="0.9"/>
    <rect x="16" y="6" width="6" height="18" fill="#ffffff" opacity="0.9"/>
    
    <!-- Windows -->
    <rect x="1" y="10" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="3.5" y="10" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="1" y="15" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="3.5" y="15" width="1.5" height="2" fill="#1FB8CD"/>
    
    <rect x="9" y="12" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="11.5" y="12" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="9" y="17" width="1.5" height="2" fill="#1FB8CD"/>
    
    <rect x="17" y="8" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="19.5" y="8" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="17" y="13" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="19.5" y="13" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="17" y="18" width="1.5" height="2" fill="#1FB8CD"/>
    <rect x="19.5" y="18" width="1.5" height="2" fill="#1FB8CD"/>
  </g>
</svg>`;
};

// Icon sizes to generate
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate all icon sizes
iconSizes.forEach(size => {
  // Regular icons
  const svgContent = createSVGIcon(size, false);
  fs.writeFileSync(path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}.svg`), svgContent);
  console.log(`✓ Generated icon-${size}x${size}.svg`);
  
  // Maskable icons (only for 192 and 512)
  if (size === 192 || size === 512) {
    const maskableSVG = createSVGIcon(size, true);
    fs.writeFileSync(path.join(__dirname, 'assets', 'icons', `icon-${size}x${size}-maskable.svg`), maskableSVG);
    console.log(`✓ Generated icon-${size}x${size}-maskable.svg`);
  }
});

// Generate favicon
const faviconSVG = createFavicon();
fs.writeFileSync(path.join(__dirname, 'favicon.svg'), faviconSVG);
console.log('✓ Generated favicon.svg');

// Create placeholder PNG files (in a real app, you'd convert SVG to PNG)
console.log('\n📝 Note: In production, convert these SVG files to PNG using a tool like:');
console.log('   npm install -g svg2png-cli');
console.log('   svg2png assets/icons/icon-192x192.svg assets/icons/icon-192x192.png');

// Create simple shortcut icons
const shortcutIcons = ['dashboard', 'project', 'inventory', 'finance'];
const shortcutColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

shortcutIcons.forEach((name, index) => {
  const color = shortcutColors[index];
  const shortcutSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="20" fill="${color}"/>
  <text x="48" y="55" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">${name.charAt(0).toUpperCase()}</text>
</svg>`;
  
  fs.writeFileSync(path.join(__dirname, 'assets', 'icons', `shortcut-${name}.svg`), shortcutSVG);
  console.log(`✓ Generated shortcut-${name}.svg`);
});

console.log('\n🎉 All PWA icons generated successfully!');
console.log('📁 Icons location: assets/icons/');
console.log('🔗 Manifest file: manifest.json');
