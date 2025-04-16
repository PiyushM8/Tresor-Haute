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
    console.log('[ORDERS_POST] Starting order creation...');
    const session = await getServerSession(authOptions);
    const body: OrderRequestBody = await req.json();
    console.log('[ORDERS_POST] Request body:', {
      ...body,
      paymentInfo: { ...body.paymentInfo, cardNumber: '[REDACTED]' }
    });

    // Validate required fields
    const { items, shippingInfo, paymentInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('[ORDERS_POST] Invalid items:', items);
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    // Validate product IDs
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        console.log('[ORDERS_POST] Invalid product ID:', item.productId);
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }
    }

    if (!shippingInfo || !validateShippingInfo(shippingInfo)) {
      console.log('[ORDERS_POST] Invalid shipping info:', shippingInfo);
      return NextResponse.json(
        { error: "Invalid shipping information" },
        { status: 400 }
      );
    }

    if (!paymentInfo || !validatePaymentInfo(paymentInfo)) {
      console.log('[ORDERS_POST] Invalid payment info');
      return NextResponse.json(
        { error: "Invalid payment information" },
        { status: 400 }
      );
    }

    let userId = session?.user?.id;
    let isGuest = false;

    // Create guest user if no session
    if (!userId) {
      try {
        console.log('[ORDERS_POST] Creating guest user...');
        const guestEmail = `guest_${Date.now()}@tresor-haute.com`;
        
        // Create guest user with a fixed password since they won't need to log in
        const guestUser = await prisma.user.upsert({
          where: { email: guestEmail },
          update: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          },
          create: {
            email: guestEmail,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            password: await bcrypt.hash('guest_password', 10),
            role: Role.USER
          }
        });
        
        userId = guestUser.id;
        isGuest = true;
        console.log('[ORDERS_POST] Guest user created/updated:', { id: userId, isGuest });
      } catch (error) {
        console.error("[ORDERS_POST] Guest user creation error:", error);
        return NextResponse.json(
          { error: "Failed to create guest user", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }

    // Calculate total and validate stock in a preliminary transaction
    let orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
    let total = 0;

    try {
      console.log('[ORDERS_POST] Validating products and stock...');
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
      console.log('[ORDERS_POST] Products validated, total:', total);
    } catch (error) {
      console.error("[ORDERS_POST] Product validation error:", error);
      return NextResponse.json(
        { 
          error: "Failed to validate products",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    // Create the order in a transaction
    try {
      console.log('[ORDERS_POST] Creating order...');
      const order = await prisma.$transaction(async (tx) => {
        const orderData = {
          userId,
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
        };

        console.log('[ORDERS_POST] Order data prepared:', {
          userId,
          total,
          isGuest,
          itemsCount: items.length
        });

        const newOrder = await tx.order.create({
          data: orderData,
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
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

        return newOrder;
      });

      console.log('[ORDERS_POST] Order created successfully');
      return NextResponse.json(order);
    } catch (error) {
      console.error("[ORDERS_POST] Order creation error:", error);
      return NextResponse.json(
        { 
          error: "Failed to create order",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[ORDERS_POST] Error details:", error);
    return NextResponse.json(
      { 
        error: "Internal error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
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