import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Saying {
  word?: string;
  definition?: string;
  items?: Saying[];
}

let cachedSayings: Saying[] | null = null;
let fileModTime = 0;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'saying.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    
    if (!cachedSayings || stat.mtimeMs > fileModTime) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // new structure is likely a simple array or an object with a results key
      if (Array.isArray(data)) {
        cachedSayings = data;
      } else if (data && Array.isArray(data.items)) {
        cachedSayings = data.items;
      } else {
        cachedSayings = [];
      }
      
      fileModTime = stat.mtimeMs;
    }

    if (!cachedSayings || cachedSayings.length === 0) {
       return NextResponse.json({ error: 'Empty or invalid file structure' }, { status: 400 });
    }

    // 배열에서 무작위 선택
    const randomIdx = Math.floor(Math.random() * cachedSayings.length);
    const randomItem = cachedSayings[randomIdx];

    if (!randomItem) {
      return NextResponse.json({ error: 'Failed to select random item' }, { status: 500 });
    }

    return NextResponse.json({
      title: randomItem.word || '제목 없음',
      description: randomItem.definition || '내용 없음'
    });
  } catch (error) {
    console.error("API Read Error:", error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
