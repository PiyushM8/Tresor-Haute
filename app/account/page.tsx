'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchOrders();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Account Information</h1>
            <div className="mt-4 space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Name:</span> {session?.user?.name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {session?.user?.email}
              </p>
              {session?.user?.role === 'ADMIN' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Admin Account
                </span>
              )}
            </div>
          </div>

          {session?.user?.role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/admin/products"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Products</h3>
                  <p className="text-sm text-gray-500">Add, edit, or remove products</p>
                </Link>
                <Link
                  href="/admin/categories"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Categories</h3>
                  <p className="text-sm text-gray-500">Update product categories</p>
                </Link>
                <Link
                  href="/admin/orders"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Orders</h3>
                  <p className="text-sm text-gray-500">View and update orders</p>
                </Link>
                <Link
                  href="/admin/careers"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Careers</h3>
                  <p className="text-sm text-gray-500">Update job listings</p>
                </Link>
                <Link
                  href="/admin/press"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Press</h3>
                  <p className="text-sm text-gray-500">Update press content</p>
                </Link>
              </div>
            </motion.div>
          )}

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className={`text-sm ${
                          order.status === 'COMPLETED' ? 'text-green-600' : 
                          order.status === 'PENDING' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No orders found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 