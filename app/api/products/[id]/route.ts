import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, price, images, category, stock } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, delete existing images
    await prisma.productImage.deleteMany({
      where: {
        productId: params.id,
      },
    });

    // Then update the product with new data
    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock) || 0,
        images: {
          create: images.map((url: string) => ({
            url,
          })),
        },
      },
      include: {
        images: true,
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
    console.log('Session in DELETE:', session);

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      console.log('User role:', session.user.role);
      return NextResponse.json(
        { error: 'Unauthorized - Not an admin' },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log('Attempting to delete product with ID:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // First check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { ProductImage: true }
    });

    if (!existingProduct) {
      console.log('Product not found:', id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Found product to delete:', existingProduct);

    // First delete all associated cart items
    try {
      console.log('Deleting cart items...');
      await prisma.cartItem.deleteMany({
        where: {
          productId: id,
        },
      });
      console.log('Cart items deleted successfully');
    } catch (error) {
      console.error('Error deleting cart items:', error);
      // Continue with other deletions even if cart items deletion fails
    }

    // Then delete all associated images
    try {
      console.log('Deleting product images...');
      await prisma.productImage.deleteMany({
        where: {
          productId: id,
        },
      });
      console.log('Product images deleted successfully');
    } catch (error) {
      console.error('Error deleting product images:', error);
      // Continue with product deletion even if image deletion fails
    }

    // Finally delete the product
    try {
      console.log('Deleting product...');
      const deletedProduct = await prisma.product.delete({
        where: {
          id,
        },
      });
      console.log('Product deleted successfully:', deletedProduct);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete product',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
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