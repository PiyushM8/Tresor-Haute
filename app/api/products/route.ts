import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('Attempting to fetch products...');
    
    // Ensure database connection
    await prisma.$connect();
    console.log('Database connection successful');

    const products = await prisma.product.findMany({
      include: {
        Category: true,
        ProductImage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${products.length} products`);
    
    // Always return an array, even if empty
    return NextResponse.json(products || [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in products API:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: error.message
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get the raw request body
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    if (!rawBody) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    // Parse the JSON
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError instanceof Error ? parseError.message : 'Unknown parse error' },
        { status: 400 }
      );
    }

    // Validate the structure of the body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const { name, description, price, stock, categoryId, images } = body;

    // Validate required fields
    if (!name || !description || !price || !stock || !categoryId) {
      console.error('Missing required fields:', { name, description, price, stock, categoryId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      console.error('Category not found:', categoryId);
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: String(name),
        description: String(description),
        price: Number(price),
        stock: Number(stock),
        category: category.name,
        categoryId: String(categoryId),
        ProductImage: {
          create: Array.isArray(images) ? images.map((url: string) => ({
            url: String(url),
          })) : [],
        },
      },
      include: {
        Category: true,
        ProductImage: true,
      },
    });

    console.log('Successfully created product:', product);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 