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

    if (!shippingInfo || !validateShippingInfo(shippingInfo)) {
      return new NextResponse("Invalid shipping information", { status: 400 });
    }

    if (!paymentInfo || !validatePaymentInfo(paymentInfo)) {
      return new NextResponse("Invalid payment information", { status: 400 });
    }

    let userId = session?.user?.id;
    let isGuest = false;

    // Create guest user if no session
    if (!userId) {
      try {
        const guestEmail = `guest_${Date.now()}@tresor-haute.com`;
        const existingUser = await prisma.user.findUnique({
          where: { email: guestEmail }
        });

        if (existingUser) {
          return new NextResponse("Failed to create guest user", { status: 500 });
        }

        const guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            password: await bcrypt.hash(Math.random().toString(36), 10),
            role: Role.USER
          }
        });
        userId = guestUser.id;
        isGuest = true;
      } catch (error) {
        console.error("[ORDERS_POST] Guest user creation error:", error);
        return new NextResponse("Failed to create guest user", { status: 500 });
      }
    }

    // Calculate total and validate stock in a preliminary transaction
    let orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
    let total = 0;

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              price: true,
              stock: true
            }
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }

          total += product.price * item.quantity;
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price
          });
        }
      });
    } catch (error) {
      console.error("[ORDERS_POST] Product validation error:", error);
      return new NextResponse(
        error instanceof Error ? error.message : "Failed to validate products",
        { status: 400 }
      );
    }

    // Create the order in a transaction
    try {
      const order = await prisma.$transaction(async (tx) => {
        const orderData = {
          user: {
            connect: {
              id: userId
            }
          },
          total,
          status: OrderStatus.PENDING,
          isGuest,
          items: {
            createMany: {
              data: orderItems
            }
          },
          shippingInfo: {
            create: {
              firstName: shippingInfo.firstName,
              lastName: shippingInfo.lastName,
              email: shippingInfo.email,
              address: shippingInfo.address,
              city: shippingInfo.city,
              postalCode: shippingInfo.postalCode
            }
          },
          paymentInfo: {
            create: {
              cardNumber: maskCardNumber(paymentInfo.cardNumber),
              expiryDate: paymentInfo.expiryDate
            }
          }
        } as const;

        const include = {
          items: {
            include: {
              product: true
            }
          },
          shippingInfo: true,
          paymentInfo: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        } as const;

        const newOrder = await tx.order.create({
          data: orderData,
          include
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

        return newOrder;
      });

      return NextResponse.json(order);
    } catch (error) {
      console.error("[ORDERS_POST] Transaction error:", error);
      return new NextResponse(
        "Failed to process order. Please try again.",
        { status: 500 }
      );
    }
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

// Validation helpers
function validateShippingInfo(info: ShippingInfo): boolean {
  return !!(
    info.firstName?.trim() &&
    info.lastName?.trim() &&
    info.email?.trim() &&
    info.email.includes('@') &&
    info.address?.trim() &&
    info.city?.trim() &&
    info.postalCode?.trim()
  );
}

function validatePaymentInfo(info: PaymentInfo): boolean {
  return !!(
    info.cardNumber?.trim() &&
    info.cardNumber.replace(/\s/g, '').length >= 15 &&
    info.expiryDate?.trim() &&
    /^\d{2}\/\d{2}$/.test(info.expiryDate)
  );
}

function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  return `****${cleaned.slice(-4)}`;
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