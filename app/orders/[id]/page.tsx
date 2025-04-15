'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Order not found'}
        </div>
        <Link href="/shop" className="text-indigo-600 hover:text-indigo-500">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <h2 className="text-3xl font-bold font-serif">Order Confirmation</h2>
              <p className="mt-2 text-indigo-100 font-sans">Order #{order.id}</p>
            </div>

            <div className="border-t border-gray-200 px-6 py-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 font-serif">Order Status</h3>
                  <p className="mt-2 text-sm text-gray-500 font-sans">
                    {order.status}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 font-serif">Order Date</h3>
                  <p className="mt-2 text-sm text-gray-500 font-sans">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6 font-serif">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-serif">{item.product.name}</p>
                      <p className="text-sm text-gray-500 font-sans">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 font-serif">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-8 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium text-gray-900 font-serif">Total Amount</h3>
                <p className="text-2xl font-bold text-indigo-600 font-serif">${order.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white px-6 py-8">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors font-sans"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-sans"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 