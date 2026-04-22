import fs from 'fs';
import { Buffer } from 'buffer';

async function downloadIcons() {
  const url192 = 'https://placehold.co/192x192/000000/ffffff.png?text=HSK%2FTOEIC';
  const url512 = 'https://placehold.co/512x512/000000/ffffff.png?text=HSK%2FTOEIC';
  const urlWide = 'https://placehold.co/1280x720/000000/ffffff.png?text=HSK%2FTOEIC';
  const urlNarrow = 'https://placehold.co/750x1334/000000/ffffff.png?text=HSK%2FTOEIC';
  
  try {
    const res192 = await fetch(url192);
    const buf192 = Buffer.from(await res192.arrayBuffer());
    fs.writeFileSync('public/icon-192x192.png', buf192);

    const res512 = await fetch(url512);
    const buf512 = Buffer.from(await res512.arrayBuffer());
    fs.writeFileSync('public/icon-512x512.png', buf512);

    const resWide = await fetch(urlWide);
    const bufWide = Buffer.from(await resWide.arrayBuffer());
    fs.writeFileSync('public/screenshot-wide.png', bufWide);

    const resNarrow = await fetch(urlNarrow);
    const bufNarrow = Buffer.from(await resNarrow.arrayBuffer());
    fs.writeFileSync('public/screenshot-mobile.png', bufNarrow);
    
    console.log('Icons and screenshots downloaded successfully');
  } catch (error) {
    console.error('Failed to download icons:', error);
  }
}

downloadIcons();
