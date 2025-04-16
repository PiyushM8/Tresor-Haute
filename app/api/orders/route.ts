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

    // Create the order in a single transaction
    try {
      console.log('[ORDERS_POST] Creating order...');
      
      const order = await prisma.$transaction(async (tx) => {
        // Calculate total and validate stock
        let total = 0;

        // Validate products and calculate total
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

          // Update stock
          await tx.$executeRaw`
            UPDATE "Product"
            SET stock = stock - ${item.quantity}
            WHERE id = ${item.productId} AND stock >= ${item.quantity}
          `;
        }

        // Create order
        const [newOrder] = await tx.$queryRaw<[{ id: string }]>`
          INSERT INTO orders (id, "userId", total, status, "isGuest", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${userId},
            ${total},
            'PENDING',
            ${isGuest},
            NOW(),
            NOW()
          )
          RETURNING id
        `;

        // Create order items
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { price: true }
          });

          if (!product) continue;

          await tx.$executeRaw`
            INSERT INTO order_items (id, "orderId", "productId", quantity, price, "createdAt", "updatedAt")
            VALUES (
              gen_random_uuid(),
              ${newOrder.id},
              ${item.productId},
              ${item.quantity},
              ${product.price},
              NOW(),
              NOW()
            )
          `;
        }

        // Create shipping info
        await tx.$executeRaw`
          INSERT INTO shipping_info (id, "orderId", "firstName", "lastName", email, address, city, "postalCode", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${newOrder.id},
            ${shippingInfo.firstName},
            ${shippingInfo.lastName},
            ${shippingInfo.email},
            ${shippingInfo.address},
            ${shippingInfo.city},
            ${shippingInfo.postalCode},
            NOW(),
            NOW()
          )
        `;

        // Create payment info
        await tx.$executeRaw`
          INSERT INTO payment_info (id, "orderId", "cardNumber", "expiryDate", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${newOrder.id},
            ${maskCardNumber(paymentInfo.cardNumber)},
            ${paymentInfo.expiryDate},
            NOW(),
            NOW()
          )
        `;

        // Get complete order
        const [completeOrder] = await tx.$queryRaw<[any]>`
          SELECT 
            o.*,
            json_build_object(
              'id', u.id,
              'email', u.email,
              'name', u.name
            ) as user,
            json_agg(
              json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price', oi.price,
                'product', json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'price', p.price,
                  'images', p.images
                )
              )
            ) as items,
            json_build_object(
              'firstName', si."firstName",
              'lastName', si."lastName",
              'email', si.email,
              'address', si.address,
              'city', si.city,
              'postalCode', si."postalCode"
            ) as "shippingInfo",
            json_build_object(
              'cardNumber', pi."cardNumber",
              'expiryDate', pi."expiryDate"
            ) as "paymentInfo"
          FROM orders o
          LEFT JOIN "User" u ON o."userId" = u.id
          LEFT JOIN order_items oi ON o.id = oi."orderId"
          LEFT JOIN "Product" p ON oi."productId" = p.id
          LEFT JOIN shipping_info si ON o.id = si."orderId"
          LEFT JOIN payment_info pi ON o.id = pi."orderId"
          WHERE o.id = ${newOrder.id}
          GROUP BY o.id, u.id, si.id, pi.id
        `;

        return completeOrder;
      });

      console.log('[ORDERS_POST] Order created successfully:', order.id);
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