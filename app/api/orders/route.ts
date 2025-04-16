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

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
}

interface OrderRequestBody {
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body: OrderRequestBody = await req.json();

    // Validate required fields
    const { items, shippingInfo, paymentInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    if (!shippingInfo) {
      return new NextResponse("Shipping information is required", { status: 400 });
    }

    if (!paymentInfo) {
      return new NextResponse("Payment information is required", { status: 400 });
    }

    // Calculate total and validate stock
    let total = 0;
    const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          price: true,
          stock: true
        }
      });

      if (!product) {
        return new NextResponse(`Product ${item.productId} not found`, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return new NextResponse(`Insufficient stock for product ${item.productId}`, { status: 400 });
      }

      total += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }

    let userId = session?.user?.id;

    // Create guest user if no session
    if (!userId) {
      const guestUser = await prisma.user.create({
        data: {
          email: `guest_${Date.now()}@example.com`,
          name: "Guest User",
          password: await bcrypt.hash(Math.random().toString(36), 10),
          role: Role.USER
        }
      });
      userId = guestUser.id;
    }

    // Create the order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          ...item,
          orderId: order.id
        }))
      });

      // Create shipping info
      await tx.ShippingInfo.create({
        data: {
          orderId: order.id,
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          address: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode
        }
      });

      // Create payment info
      await tx.PaymentInfo.create({
        data: {
          orderId: order.id,
          cardNumber: paymentInfo.cardNumber,
          expiryDate: paymentInfo.expiryDate
        }
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      return order;
    });

    // Fetch the complete order with all relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        ShippingInfo: true,
        PaymentInfo: true
      }
    });

    return NextResponse.json(completeOrder);

  } catch (error) {
    console.error("[ORDERS_POST] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal error",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
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
    if (session.user.role === Role.ADMIN) {
      const orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          }
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
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 