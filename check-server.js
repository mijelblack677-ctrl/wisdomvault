import fs from 'fs';
import path from 'path';

console.log('🔍 Checking server files...');

const entryPath = './dist/server/entry.mjs';

if (fs.existsSync(entryPath)) {
  console.log('✅ Entry point found:', entryPath);
  
  // Check if it's readable
  try {
    const content = fs.readFileSync(entryPath, 'utf8');
    console.log('✅ Entry point is readable');
    console.log('📝 First 100 chars:', content.substring(0, 100));
  } catch (err) {
    console.error('❌ Cannot read entry point:', err.message);
  }
} else {
  console.error('❌ Entry point not found!');
  
  // Check what is in dist
  if (fs.existsSync('./dist')) {
    console.log('📁 Contents of dist:');
    const files = fs.readdirSync('./dist');
    files.forEach(file => {
      const stat = fs.statSync(`./dist/${file}`);
      console.log(`   ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
    });
  } else {
    console.log('❌ dist folder not found!');
  }
}
