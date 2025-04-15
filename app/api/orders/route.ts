import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, shippingInfo, paymentInfo, isGuest } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    if (!shippingInfo || !paymentInfo) {
      return NextResponse.json(
        { error: 'Shipping and payment information are required' },
        { status: 400 }
      );
    }

    // Create a guest user if needed
    let userId = session?.user?.id;
    if (isGuest && !userId) {
      const guestUser = await prisma.user.create({
        data: {
          email: shippingInfo.email,
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          role: 'USER',
          password: 'guest', // This is just a placeholder, guest users can't log in
        },
      });
      userId = guestUser.id;
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Create order with items
    const order = await prisma.$transaction(async (tx: PrismaClient) => {
      try {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            userId,
            total,
            status: 'PENDING',
            shippingInfo: {
              firstName: shippingInfo.firstName,
              lastName: shippingInfo.lastName,
              email: shippingInfo.email,
              address: shippingInfo.address,
              city: shippingInfo.city,
              postalCode: shippingInfo.postalCode,
            },
            paymentInfo: {
              cardNumber: paymentInfo.cardNumber,
              expiryDate: paymentInfo.expiryDate,
            },
            isGuest,
          },
        });

        // Create order items and update stock
        for (const item of items) {
          // Check stock availability
          const product = await tx.product.findUnique({
            where: { id: item.id },
          });

          if (!product) {
            throw new Error(`Product ${item.id} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          // Create order item
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return newOrder;
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
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