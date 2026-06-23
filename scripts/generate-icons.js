const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Interswitch brand colors
const colors = {
  primary: '#00A859', // Interswitch green
  dark: '#007A40',
  light: '#00C96B',
  white: '#FFFFFF',
};

// Generate icon for a given size
function generateIcon(size, filename, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.dark);
  
  // For maskable icons, add padding
  const padding = maskable ? size * 0.1 : 0;
  const iconSize = size - (padding * 2);
  
  // Draw rounded rectangle background
  const radius = iconSize * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(padding, padding, iconSize, iconSize, radius);
  ctx.fill();

  // Draw "ISW" text
  ctx.fillStyle = colors.white;
  ctx.font = `bold ${iconSize * 0.4}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ISW', size / 2, size / 2);

  // Add subtle shine effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(size * 0.3, size * 0.3, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Write file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

// Generate all required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...\n');

sizes.forEach(size => {
  generateIcon(size, `icon-${size}x${size}.png`);
});

// Generate maskable icons
generateIcon(192, 'icon-maskable-192x192.png', true);
generateIcon(512, 'icon-maskable-512x512.png', true);

// Generate apple touch icon (180x180)
generateIcon(180, 'apple-touch-icon.png', true);

console.log('\n✓ All icons generated successfully!');
console.log(`Icons saved to: ${iconsDir}`);
