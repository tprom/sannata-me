import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    // Получаем тип данных из query параметра
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'announcement';
    
    const filePath = join(process.cwd(), 'public', 'books', slug, `${type}.json`);
    const fileContent = await readFile(filePath, 'utf-8');
    
    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading book file:', error);
    return new Response(
      JSON.stringify({ error: 'Book not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
