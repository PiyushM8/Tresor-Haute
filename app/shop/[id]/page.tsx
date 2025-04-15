'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useCart } from '@/app/context/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  ProductImage: Array<{ url: string }>;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function ProductPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('Frontend - Starting to fetch product with ID:', id);
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      console.log('Frontend - Making API request to:', `/api/products/${id}`);
      const response = await fetch(`/api/products/${id}`);
      console.log('Frontend - API Response status:', response.status);
      
      const data = await response.json();
      console.log('Frontend - API Response data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('Frontend - Error response:', data);
        setError(data);
        return;
      }

      console.log('Frontend - Setting product data:', JSON.stringify(data, null, 2));
      setProduct(data);
    } catch (error) {
      console.error('Frontend - Error fetching product:', error);
      setError({
        error: 'An error occurred while fetching the product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      // Remove the redirect to cart page
      // router.push('/cart');
    } catch (error) {
      setError({
        error: 'Failed to add product to cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">{error?.error || 'Product not found'}</p>
            {error?.details && (
              <p className="mt-2 text-sm">{error.details}</p>
            )}
            <p className="mt-2 text-sm">Product ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      unoptimized
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-2xl font-semibold text-gold-600 mt-2">${product.price.toFixed(2)}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Stock:</span>
                <span className="font-medium">{product.stock}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, product.stock))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`flex-1 px-6 py-3 rounded-md text-white font-medium ${
                  product.stock === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gold-600 hover:bg-gold-700'
                }`}
              >
                {addingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 