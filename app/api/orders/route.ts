import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { OrderStatus, Role, Prisma } from '@prisma/client';

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

interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

interface OrderInput {
  items: OrderItemInput[];
  shippingInfo: ShippingInfoInput;
  paymentInfo: PaymentInfoInput;
}

interface CompleteOrder {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  shippingInfo: {
    id: string;
    orderId: string;
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  } | null;
  paymentInfo: {
    id: string;
    orderId: string;
    cardNumber: string;
    expiryDate: string;
  } | null;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      stock: number;
      images: string[];
      categoryId: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}

interface AdminOrder extends CompleteOrder {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function POST(req: Request) {
  console.log('[ORDERS_POST] Starting order creation...');
  try {
    const session = await getServerSession(authOptions);
    const data: OrderInput = await req.json();
    
    // Log request data (excluding sensitive information)
    console.log('[ORDERS_POST] Request data:', {
      ...data,
      paymentInfo: { ...data.paymentInfo, cardNumber: '[REDACTED]' },
      items: data.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });

    const { items, shippingInfo, paymentInfo } = data;

    // Validate request data
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[ORDERS_POST] Invalid items:', items);
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!shippingInfo || !paymentInfo) {
      console.error('[ORDERS_POST] Missing shipping or payment info:', { shippingInfo, paymentInfo });
      return NextResponse.json(
        { error: 'Shipping and payment information are required' },
        { status: 400 }
      );
    }

    // Validate shipping info
    if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || 
        !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
      console.error('[ORDERS_POST] Invalid shipping info:', shippingInfo);
      return NextResponse.json(
        { error: 'All shipping information fields are required' },
        { status: 400 }
      );
    }

    // Validate payment info
    if (!paymentInfo.cardNumber || !paymentInfo.expiryDate) {
      console.error('[ORDERS_POST] Invalid payment info:', { ...paymentInfo, cardNumber: '[REDACTED]' });
      return NextResponse.json(
        { error: 'All payment information fields are required' },
        { status: 400 }
      );
    }

    let userId: string;

    if (session?.user) {
      userId = session.user.id;
      console.log('[ORDERS_POST] Using authenticated user:', userId);
    } else {
      console.log('[ORDERS_POST] Creating guest user...');
      try {
        // First try to find an existing user with the email
        const existingUser = await prisma.user.findUnique({
          where: { email: shippingInfo.email },
        });

        if (existingUser) {
          userId = existingUser.id;
          console.log('[ORDERS_POST] Using existing user:', { id: userId });
        } else {
          // If no user exists, create a new one with a unique email
          const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
          const guestUser = await prisma.user.create({
            data: {
              name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
              email: shippingInfo.email,
              password: hashedPassword,
              role: Role.USER,
            },
          });
          userId = guestUser.id;
          console.log('[ORDERS_POST] Guest user created:', { id: userId });
        }
      } catch (error) {
        console.error('[ORDERS_POST] Error handling guest user:', error);
        // If there's still a conflict, create a user with a modified email
        const uniqueEmail = `${shippingInfo.email.split('@')[0]}+${Date.now()}@${shippingInfo.email.split('@')[1]}`;
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        const guestUser = await prisma.user.create({
          data: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: uniqueEmail,
            password: hashedPassword,
            role: Role.USER,
          },
        });
        userId = guestUser.id;
        console.log('[ORDERS_POST] Guest user created with unique email:', { id: userId, email: uniqueEmail });
      }
    }

    // Validate products and calculate total
    console.log('[ORDERS_POST] Validating products and stock...');
    let total = 0;
    const validatedItems = [];
    
    for (const item of items) {
      if (!item.productId) {
        console.error('[ORDERS_POST] Missing product ID in item:', item);
        return NextResponse.json(
          { error: 'Product ID is required for all items' },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      });

      if (!product) {
        console.error('[ORDERS_POST] Product not found:', item.productId);
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        console.error('[ORDERS_POST] Insufficient stock:', { product, requestedQuantity: item.quantity });
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}. Only ${product.stock} available.` },
          { status: 400 }
        );
      }

      total += product.price * item.quantity;
      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    if (validatedItems.length === 0) {
      console.error('[ORDERS_POST] No valid items in order');
      return NextResponse.json(
        { error: 'No valid items in the order' },
        { status: 400 }
      );
    }

    console.log('[ORDERS_POST] Products validated, total:', total);

    // Create the order with its items
    console.log('[ORDERS_POST] Creating order...');
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: OrderStatus.PENDING,
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log('[ORDERS_POST] Order created:', order.id);

    // Create shipping info
    try {
      await prisma.$queryRaw`
        INSERT INTO shipping_info (
          id,
          "orderId",
          "firstName",
          "lastName",
          email,
          address,
          city,
          "postalCode",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${order.id},
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
      console.log('[ORDERS_POST] Shipping info created for order:', order.id);
    } catch (error) {
      console.error('[ORDERS_POST] Error creating shipping info:', error);
      // Clean up the order if shipping info creation fails
      await prisma.order.delete({ where: { id: order.id } });
      throw new Error('Failed to create shipping information');
    }

    // Create payment info
    try {
      await prisma.$queryRaw`
        INSERT INTO payment_info (
          id,
          "orderId",
          "cardNumber",
          "expiryDate",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${order.id},
          ${paymentInfo.cardNumber},
          ${paymentInfo.expiryDate},
          NOW(),
          NOW()
        )
      `;
      console.log('[ORDERS_POST] Payment info created for order:', order.id);
    } catch (error) {
      console.error('[ORDERS_POST] Error creating payment info:', error);
      // Clean up the order and shipping info if payment info creation fails
      await prisma.$queryRaw`DELETE FROM shipping_info WHERE "orderId" = ${order.id}`;
      await prisma.order.delete({ where: { id: order.id } });
      throw new Error('Failed to create payment information');
    }

    // Update product stock
    console.log('[ORDERS_POST] Updating product stock...');
    for (const item of validatedItems) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        console.log('[ORDERS_POST] Stock updated for product:', item.productId);
      } catch (error) {
        console.error('[ORDERS_POST] Error updating stock for product:', item.productId, error);
        // Revert stock updates for previously processed items
        for (const processedItem of validatedItems) {
          if (processedItem.productId === item.productId) break;
          await prisma.product.update({
            where: { id: processedItem.productId },
            data: {
              stock: {
                increment: processedItem.quantity,
              },
            },
          });
        }
        // Clean up the order and related info
        await prisma.$queryRaw`DELETE FROM payment_info WHERE "orderId" = ${order.id}`;
        await prisma.$queryRaw`DELETE FROM shipping_info WHERE "orderId" = ${order.id}`;
        await prisma.order.delete({ where: { id: order.id } });
        throw new Error('Failed to update product stock');
      }
    }

    // Return the complete order with all relations
    const [completeOrder] = await prisma.$queryRaw<CompleteOrder[]>`
      SELECT
        o.*,
        json_build_object(
          'id', si.id,
          'orderId', si."orderId",
          'firstName', si."firstName",
          'lastName', si."lastName",
          'email', si.email,
          'address', si.address,
          'city', si.city,
          'postalCode', si."postalCode"
        ) as "shippingInfo",
        json_build_object(
          'id', pi.id,
          'orderId', pi."orderId",
          'cardNumber', pi."cardNumber",
          'expiryDate', pi."expiryDate"
        ) as "paymentInfo",
        json_agg(
          json_build_object(
            'id', oi.id,
            'orderId', oi."orderId",
            'productId', oi."productId",
            'quantity', oi.quantity,
            'price', oi.price,
            'product', p
          )
        ) as items
      FROM orders o
      LEFT JOIN shipping_info si ON si."orderId" = o.id
      LEFT JOIN payment_info pi ON pi."orderId" = o.id
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      LEFT JOIN products p ON p.id = oi."productId"
      WHERE o.id = ${order.id}
      GROUP BY o.id, si.id, pi.id
    `;

    if (!completeOrder) {
      console.error('[ORDERS_POST] Failed to fetch created order:', order.id);
      throw new Error('Failed to fetch created order');
    }

    console.log('[ORDERS_POST] Order created successfully:', order.id);
    return NextResponse.json(completeOrder);
  } catch (error) {
    console.error('[ORDERS_POST] Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');

    // If orderId is provided, fetch specific order
    if (orderId) {
      const [order] = await prisma.$queryRaw<CompleteOrder[]>`
        SELECT
          o.*,
          json_build_object(
            'id', si.id,
            'orderId', si."orderId",
            'firstName', si."firstName",
            'lastName', si."lastName",
            'email', si.email,
            'address', si.address,
            'city', si.city,
            'postalCode', si."postalCode"
          ) as "shippingInfo",
          json_build_object(
            'id', pi.id,
            'orderId', pi."orderId",
            'cardNumber', pi."cardNumber",
            'expiryDate', pi."expiryDate"
          ) as "paymentInfo",
          json_agg(
            json_build_object(
              'id', oi.id,
              'orderId', oi."orderId",
              'productId', oi."productId",
              'quantity', oi.quantity,
              'price', oi.price,
              'product', p
            )
          ) as items
        FROM orders o
        LEFT JOIN shipping_info si ON si."orderId" = o.id
        LEFT JOIN payment_info pi ON pi."orderId" = o.id
        LEFT JOIN order_items oi ON oi."orderId" = o.id
        LEFT JOIN products p ON p.id = oi."productId"
        WHERE o.id = ${orderId}
        GROUP BY o.id, si.id, pi.id
      `;

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // If user is not logged in, verify email matches
      if (!session?.user && order.shippingInfo?.email !== email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return NextResponse.json(order);
    }

    // If user is not logged in, return error
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If user is admin, return all orders
    if (session.user.role === Role.ADMIN) {
      const orders = await prisma.$queryRaw<AdminOrder[]>`
        SELECT
          o.*,
          json_build_object(
            'id', si.id,
            'orderId', si."orderId",
            'firstName', si."firstName",
            'lastName', si."lastName",
            'email', si.email,
            'address', si.address,
            'city', si.city,
            'postalCode', si."postalCode"
          ) as "shippingInfo",
          json_build_object(
            'id', pi.id,
            'orderId', pi."orderId",
            'cardNumber', pi."cardNumber",
            'expiryDate', pi."expiryDate"
          ) as "paymentInfo",
          json_agg(
            json_build_object(
              'id', oi.id,
              'orderId', oi."orderId",
              'productId', oi."productId",
              'quantity', oi.quantity,
              'price', oi.price,
              'product', p
            )
          ) as items,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          ) as user
        FROM orders o
        LEFT JOIN shipping_info si ON si."orderId" = o.id
        LEFT JOIN payment_info pi ON pi."orderId" = o.id
        LEFT JOIN order_items oi ON oi."orderId" = o.id
        LEFT JOIN products p ON p.id = oi."productId"
        LEFT JOIN users u ON u.id = o."userId"
        GROUP BY o.id, si.id, pi.id, u.id
        ORDER BY o."createdAt" DESC
      `;

      return NextResponse.json(orders);
    }

    // If regular user, return their orders
    const orders = await prisma.$queryRaw<CompleteOrder[]>`
      SELECT
        o.*,
        json_build_object(
          'id', si.id,
          'orderId', si."orderId",
          'firstName', si."firstName",
          'lastName', si."lastName",
          'email', si.email,
          'address', si.address,
          'city', si.city,
          'postalCode', si."postalCode"
        ) as "shippingInfo",
        json_build_object(
          'id', pi.id,
          'orderId', pi."orderId",
          'cardNumber', pi."cardNumber",
          'expiryDate', pi."expiryDate"
        ) as "paymentInfo",
        json_agg(
          json_build_object(
            'id', oi.id,
            'orderId', oi."orderId",
            'productId', oi."productId",
            'quantity', oi.quantity,
            'price', oi.price,
            'product', p
          )
        ) as items
      FROM orders o
      LEFT JOIN shipping_info si ON si."orderId" = o.id
      LEFT JOIN payment_info pi ON pi."orderId" = o.id
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      LEFT JOIN products p ON p.id = oi."productId"
      WHERE o."userId" = ${session.user.id}
      GROUP BY o.id, si.id, pi.id
      ORDER BY o."createdAt" DESC
    `;

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ORDERS_GET] Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 