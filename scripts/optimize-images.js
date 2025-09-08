#!/usr/bin/env node
// Image Optimization Script for Construction ERP
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');
const OUTPUT_DIR = path.join(__dirname, '../dist/assets');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const IMAGE_QUALITY = {
  webp: 80,
  jpeg: 85,
  png: 90
};

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

async function optimizeIcon(size) {
  const inputPath = path.join(ASSETS_DIR, 'icons', `icon-${size}x${size}.png`);
  const outputDir = path.join(OUTPUT_DIR, 'icons');
  
  await ensureDirectory(outputDir);
  
  try {
    // Check if source exists
    await fs.access(inputPath);
    
    // Generate optimized PNG
    await sharp(inputPath)
      .resize(size, size, { 
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality: IMAGE_QUALITY.png,
        compressionLevel: 9,
        progressive: true
      })
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    
    // Generate WebP version for modern browsers
    await sharp(inputPath)
      .resize(size, size, { 
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality: IMAGE_QUALITY.webp,
        effort: 6
      })
      .toFile(path.join(outputDir, `icon-${size}x${size}.webp`));
    
    // Generate maskable version for Android
    if ([192, 512].includes(size)) {
      await sharp(inputPath)
        .resize(size, size)
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 31, g: 184, b: 205, alpha: 1 }
        })
        .png({ quality: IMAGE_QUALITY.png })
        .toFile(path.join(outputDir, `icon-${size}x${size}-maskable.png`));
    }
    
    console.log(`✅ Optimized icon: ${size}x${size}`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Generate placeholder icon if source doesn't exist
      await generatePlaceholderIcon(size, outputDir);
    } else {
      console.error(`❌ Failed to optimize icon ${size}x${size}:`, error.message);
    }
  }
}

async function generatePlaceholderIcon(size, outputDir) {
  try {
    // Generate SVG placeholder
    const svgContent = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1FB8CD;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1A9CB8;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" rx="${size * 0.125}"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
              font-family="Arial, sans-serif" 
              font-size="${size * 0.4}" 
              fill="white" 
              font-weight="bold">🏗️</text>
      </svg>
    `;
    
    // Convert SVG to PNG
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png({ quality: IMAGE_QUALITY.png })
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
    console.log(`🎨 Generated placeholder icon: ${size}x${size}`);
    
  } catch (error) {
    console.error(`❌ Failed to generate placeholder icon ${size}x${size}:`, error.message);
  }
}

async function optimizeScreenshots() {
  const screenshotsDir = path.join(ASSETS_DIR, 'screenshots');
  const outputDir = path.join(OUTPUT_DIR, 'screenshots');
  
  await ensureDirectory(outputDir);
  
  try {
    const screenshots = await fs.readdir(screenshotsDir);
    
    for (const screenshot of screenshots) {
      if (screenshot.endsWith('.png') || screenshot.endsWith('.jpg') || screenshot.endsWith('.jpeg')) {
        const inputPath = path.join(screenshotsDir, screenshot);
        const basename = path.parse(screenshot).name;
        
        // Optimize and convert to multiple formats
        await sharp(inputPath)
          .jpeg({ quality: IMAGE_QUALITY.jpeg, progressive: true })
          .toFile(path.join(outputDir, `${basename}.jpg`));
          
        await sharp(inputPath)
          .webp({ quality: IMAGE_QUALITY.webp, effort: 6 })
          .toFile(path.join(outputDir, `${basename}.webp`));
          
        console.log(`✅ Optimized screenshot: ${screenshot}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Screenshots directory not found, creating placeholders...`);
    await generateScreenshotPlaceholders(outputDir);
  }
}

async function generateScreenshotPlaceholders(outputDir) {
  const screenshots = [
    { name: 'desktop-dashboard', width: 1280, height: 720 },
    { name: 'mobile-dashboard', width: 390, height: 844 }
  ];
  
  for (const { name, width, height } of screenshots) {
    const svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <rect x="0" y="0" width="100%" height="60" fill="#1FB8CD"/>
        <text x="20" y="40" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">ConstructERP</text>
        <rect x="20" y="80" width="${Math.round(width * 0.25)}" height="${height - 100}" fill="#e5e7eb" rx="8"/>
        <rect x="${Math.round(width * 0.3)}" y="80" width="${Math.round(width * 0.65)}" height="${Math.round((height - 100) * 0.3)}" fill="#white" stroke="#e5e7eb" rx="8"/>
        <text x="${Math.round(width * 0.5)}" y="${Math.round(height * 0.5)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width * 0.02)}" fill="#6b7280">Construction ERP Dashboard</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svgContent))
      .png({ quality: IMAGE_QUALITY.png })
      .toFile(path.join(outputDir, `${name}.png`));
      
    console.log(`🎨 Generated placeholder screenshot: ${name}`);
  }
}

async function optimizeImages() {
  console.log('🚀 Starting image optimization...');
  
  try {
    // Ensure output directory exists
    await ensureDirectory(OUTPUT_DIR);
    
    // Optimize icons
    console.log('📱 Optimizing icons...');
    await Promise.all(ICON_SIZES.map(size => optimizeIcon(size)));
    
    // Optimize screenshots
    console.log('📸 Optimizing screenshots...');
    await optimizeScreenshots();
    
    // Generate favicon
    await generateFavicon();
    
    console.log('✅ Image optimization completed successfully!');
    console.log(`📊 Optimized assets saved to: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    process.exit(1);
  }
}

async function generateFavicon() {
  const outputPath = path.join(OUTPUT_DIR, 'favicon.ico');
  
  try {
    // Generate SVG favicon
    const svgContent = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#1FB8CD" rx="4"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              fill="white">🏗️</text>
      </svg>
    `;
    
    // Convert to ICO format
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(outputPath);
      
    console.log('✅ Generated favicon.ico');
    
  } catch (error) {
    console.warn('⚠️ Failed to generate favicon:', error.message);
  }
}

// Run optimization
if (require.main === module) {
  optimizeImages();
}

module.exports = { optimizeImages };
