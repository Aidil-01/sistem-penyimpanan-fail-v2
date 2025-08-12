// Simple icon generator using HTML5 Canvas
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#1d4ed8');
    
    // Draw rounded rectangle background
    const radius = size * 0.125;
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.fill();
    
    // Draw file cabinet icon
    const iconSize = size * 0.5;
    const iconX = size * 0.25;
    const iconY = size * 0.2;
    
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineWidth = size * 0.015;
    
    // Main cabinet outline
    roundRect(ctx, iconX, iconY, iconSize, iconSize * 1.3, size * 0.03);
    ctx.stroke();
    
    // Drawers
    const drawerHeight = iconSize * 0.25;
    const drawerWidth = iconSize * 0.8;
    const drawerX = iconX + iconSize * 0.1;
    
    for(let i = 0; i < 3; i++) {
        const drawerY = iconY + iconSize * 0.15 + (i * drawerHeight * 1.2);
        ctx.globalAlpha = 0.9 - (i * 0.2);
        roundRect(ctx, drawerX, drawerY, drawerWidth, drawerHeight, size * 0.015);
        ctx.fill();
        
        // Handle
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(drawerX + drawerWidth - size * 0.04, drawerY + drawerHeight/2, size * 0.015, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Text
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.09}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('SPF', size/2, size * 0.78);
    
    return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('./assets/icons')) {
    fs.mkdirSync('./assets/icons', { recursive: true });
}

// Generate all icon sizes
sizes.forEach(size => {
    const buffer = createIcon(size);
    fs.writeFileSync(`./assets/icons/icon-${size}x${size}.png`, buffer);
    console.log(`Generated icon-${size}x${size}.png`);
});

console.log('All icons generated successfully!');