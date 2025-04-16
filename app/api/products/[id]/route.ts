import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, images, category, stock } = body;

    if (!name || !description || !price || !images || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        price: parseFloat(price),
        images,
        category,
        stock: parseInt(stock) || 0,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        orderItems: true,
        cartItems: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if the product is referenced in any orders or carts
    if (product.orderItems.length > 0 || product.cartItems.length > 0) {
      const references = [];
      if (product.orderItems.length > 0) references.push('orders');
      if (product.cartItems.length > 0) references.push('shopping carts');
      
      return NextResponse.json(
        { 
          error: 'Cannot delete product',
          details: `This product is referenced in existing ${references.join(' and ')}. Please archive it instead.`
        },
        { status: 400 }
      );
    }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete product',
            details: 'This product is referenced in existing orders or shopping carts. Please archive it instead.'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API Route - Fetching product with ID:', params.id);
    
    if (!params.id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        ProductImage: true,
      },
    });

    console.log('API Route - Found product:', JSON.stringify(product, null, 2));

    if (!product) {
      console.log('API Route - Product not found');
      return NextResponse.json(
        { error: `Product with ID ${params.id} not found` },
        { status: 404 }
      );
    }

    // Transform the product data to include image URLs
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.ProductImage.map((image: { url: string }) => image.url),
    };

    console.log('API Route - Transformed product:', JSON.stringify(transformedProduct, null, 2));

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('API Route - Error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 