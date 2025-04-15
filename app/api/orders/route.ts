import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';

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

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        );
      }
    }

    // Validate shipping info if provided
    if (shippingInfo) {
      const requiredShippingFields = ['firstName', 'lastName', 'email', 'address', 'city', 'postalCode'];
      for (const field of requiredShippingFields) {
        if (!shippingInfo[field]) {
          return NextResponse.json(
            { error: `Missing required shipping field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate payment info if provided
    if (paymentInfo) {
      const requiredPaymentFields = ['cardNumber', 'expiryDate'];
      for (const field of requiredPaymentFields) {
        if (!paymentInfo[field]) {
          return NextResponse.json(
            { error: `Missing required payment field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    // For guest users, we need to create a temporary user
    let userId = session?.user?.id;
    if (isGuest && !userId) {
      if (!shippingInfo) {
        return NextResponse.json(
          { error: 'Shipping info is required for guest orders' },
          { status: 400 }
        );
      }
      const guestUser = await prisma.user.create({
        data: {
          name: shippingInfo.firstName + ' ' + shippingInfo.lastName,
          email: shippingInfo.email,
          password: Math.random().toString(36).slice(-8), // Temporary password
          role: 'USER',
        },
      });
      userId = guestUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create order with items
    const order = await prisma.$transaction(async (tx) => {
      // Check if products exist and are in stock
      const productIds = items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds
          }
        },
        select: {
          id: true,
          stock: true,
          price: true
        }
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      // Check stock and validate prices
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.productId}`);
        }
        if (product.price !== item.price) {
          throw new Error(`Price mismatch for product: ${item.productId}`);
        }
      }

      // Create the order first
      const newOrder = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: OrderStatus.PENDING,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // Create shipping info if provided
      if (shippingInfo) {
        await tx.shippingInfo.create({
          data: {
            orderId: newOrder.id,
            firstName: shippingInfo.firstName,
            lastName: shippingInfo.lastName,
            email: shippingInfo.email,
            address: shippingInfo.address,
            city: shippingInfo.city,
            postalCode: shippingInfo.postalCode,
          },
        });
      }

      // Create payment info if provided
      if (paymentInfo) {
        await tx.paymentInfo.create({
          data: {
            orderId: newOrder.id,
            cardNumber: paymentInfo.cardNumber,
            expiryDate: paymentInfo.expiryDate,
          },
        });
      }

      // Update product stock
      await Promise.all(
        items.map(item =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })
        )
      );

      // Update the order with isGuest flag
      await tx.order.update({
        where: { id: newOrder.id },
        data: { isGuest: isGuest || false },
      });

      return newOrder;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
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