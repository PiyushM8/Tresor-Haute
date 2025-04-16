import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        Category: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // For testing purposes, allow product creation without authentication
    // if (!session || session.user.role !== Role.ADMIN) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await req.json();
    const { name, description, price, category, images, stock } = body;

    if (!name || !description || !price || !category || !images || !stock) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or get the category
    const existingCategory = await prisma.category.findFirst({
      where: { name: category }
    });

    let categoryId = existingCategory?.id;

    if (!existingCategory) {
      const newCategory = await prisma.category.create({
        data: {
          name: category
        }
      });
      categoryId = newCategory.id;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        categoryId,
        images,
        stock: parseInt(stock),
      },
      include: {
        Category: true
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 