'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Role } from '@prisma/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface Career {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'careers'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (session?.user?.role !== Role.ADMIN) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === Role.ADMIN) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [productsRes, careersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/careers')
      ]);

      const productsData = await productsRes.json();
      const careersData = await careersRes.json();

      setProducts(productsData);
      setCareers(careersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-gray-900">
            Admin Dashboard
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'products'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('careers')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'careers'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Careers
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'products' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-gray-900">Products</h2>
                <button
                  onClick={() => router.push('/admin/products/new')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Add Product
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-lg shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {product.category}
                      </p>
                      <p className="mt-2 text-gray-600">{product.description}</p>
                      <p className="mt-2 font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </p>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}`)}
                          className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-gray-900">Careers</h2>
                <button
                  onClick={() => router.push('/admin/careers/new')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Add Career
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {careers.map((career) => (
                  <motion.div
                    key={career.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {career.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {career.location} • {career.type}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/careers/${career.id}`)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCareer(career.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-600">{career.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  async function handleDeleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        setProducts(products.filter((product) => product.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  }

  async function handleDeleteCareer(id: string) {
    if (confirm('Are you sure you want to delete this career posting?')) {
      try {
        await fetch(`/api/careers/${id}`, {
          method: 'DELETE',
        });
        setCareers(careers.filter((career) => career.id !== id));
      } catch (error) {
        console.error('Error deleting career:', error);
      }
    }
  }
}