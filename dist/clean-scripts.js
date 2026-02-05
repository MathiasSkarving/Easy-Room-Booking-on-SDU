import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');

function walkAndClean(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            walkAndClean(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            const cleanedContent = content.replace(/export\s*\{\s*\}\s*;?/g, '');

            if (content !== cleanedContent) {
                fs.writeFileSync(fullPath, cleanedContent);
                console.log(`Cleaned: ${path.relative(distPath, fullPath)}`);
            }
        }
    });
}

if (fs.existsSync(distPath)) {
    console.log('Cleaning ES modules from dist scripts...');
    walkAndClean(distPath);
} else {
    console.error('Dist folder not found! Run build first.');
}