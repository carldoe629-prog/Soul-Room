const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// 1. Generate the Icon (1024x1024)
// We'll create an SVG of the exact glowing SR logo text on a gradient background
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF4B6E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF8D5C;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#grad)" />
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="bold" font-size="450" fill="white" text-anchor="middle" dominant-baseline="middle">SR</text>
</svg>
`;

async function generate() {
  try {
    // Save icon
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ Generated assets/icon.png (1024x1024)');

    // 2. Generate the Splash Screen (2732x2732)
    // Dark background with the logo centered
    const splashSvg = `
    <svg width="2732" height="2732" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF4B6E;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FF8D5C;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Dark background -->
      <rect width="2732" height="2732" fill="#0C0C0E" />
      
      <!-- Logo box -->
      <g transform="translate(1116, 1116)">
        <rect width="500" height="500" rx="100" fill="url(#grad)" />
        <text x="250" y="270" font-family="Arial, sans-serif" font-weight="bold" font-size="220" fill="white" text-anchor="middle" dominant-baseline="middle">SR</text>
      </g>
    </svg>
    `;

    await sharp(Buffer.from(splashSvg))
      .resize(2732, 2732)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ Generated assets/splash.png (2732x2732)');
  } catch (err) {
    console.error('Error generating images:', err);
  }
}

generate();
