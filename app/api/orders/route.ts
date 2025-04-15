import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Define types for request body
interface OrderItem {
  productId: string;
  quantity: number;
}

interface ShippingInfoInput {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

interface PaymentInfoInput {
  cardNumber: string;
  expiryDate: string;
}

interface OrderRequestBody {
  items: OrderItem[];
  shippingInfo: ShippingInfoInput;
  paymentInfo: PaymentInfoInput;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as OrderRequestBody;
    const { items, shippingInfo, paymentInfo } = body;

    // Validate required fields
    if (!items?.length || !shippingInfo || !paymentInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total and validate products
    let total = 0;
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      );
    }

    // Check stock and calculate total
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        );
      }
      total += product.price * item.quantity;
    }

    // Create or get user
    let userId: string;
    if (session?.user) {
      userId = session.user.id;
    } else {
      // Create guest user with hashed password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const guestUser = await prisma.user.create({
        data: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          password: hashedPassword,
          role: Role.USER,
        },
      });
      userId = guestUser.id;
    }

    // Create order and related data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          total,
          status: OrderStatus.PENDING,
          items: {
            create: items.map(item => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              price: products.find(p => p.id === item.productId)?.price || 0,
            })),
          },
        },
      });

      // Create shipping info
      await tx.shippingInfo.create({
        data: {
          order: { connect: { id: order.id } },
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          address: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
        },
      });

      // Create payment info
      await tx.paymentInfo.create({
        data: {
          order: { connect: { id: order.id } },
          cardNumber: paymentInfo.cardNumber,
          expiryDate: paymentInfo.expiryDate,
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Return the complete order
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingInfo: true,
          paymentInfo: true,
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create order');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If user is admin, return all orders
    if (session.user.role === 'ADMIN') {
      const orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json(orders);
    }

    // If regular user, return only their orders
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 