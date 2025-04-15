'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/app/context/CartContext';
import { useRouter } from 'next/navigation';
import { FiFilter, FiSearch, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { useSession } from 'next-auth/react';

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

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const { addItem } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    fetchProducts();
    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.map((product: Product) => product.id));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavorite = async (productId: string) => {
    console.log('handleFavorite called with productId:', productId);
    console.log('Current session status:', status);
    
    if (status === 'unauthenticated') {
      console.log('User is not authenticated, storing pending favorite');
      // Store the product ID in localStorage before redirecting
      localStorage.setItem('pendingFavorite', productId);
      router.push('/signin');
      return;
    }

    setFavoriteLoading(productId);
    try {
      console.log('Making API request to toggle favorite');
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (response.ok) {
        const isFavorited = favorites.includes(productId);
        console.log('Current favorites state:', favorites);
        console.log('Is product favorited:', isFavorited);
        setFavorites(prev => {
          const newFavorites = isFavorited 
            ? prev.filter(id => id !== productId)
            : [...prev, productId];
          console.log('New favorites state:', newFavorites);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await addItem(productId, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(product => product.category)))];

  const filteredProducts = products
    .filter(product => 
      selectedCategory === 'All' || product.category === selectedCategory
    )
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-offwhite">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gold-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center bg-offwhite px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center bg-offwhite px-4">
        <p className="text-gray-600 mb-4">No products available at the moment.</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-offwhite">
      {/* Hero Section */}
      <div className="relative h-96 mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <Image
          src="/images/shop-hero.jpg"
          alt="Shop Hero"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Discover Our Collection</h1>
            <p className="text-xl md:text-2xl">Premium fashion for the modern individual</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-600"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-600"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
            <div className="relative">
              <button className="px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2">
                <FiFilter />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                  selectedCategory === category
                    ? 'bg-gold-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <Link href={`/shop/${product.id}`} className="block">
                  <div className="aspect-square relative overflow-hidden">
                    {(product.ProductImage && product.ProductImage.length > 0) ? (
                      <Image
                        src={product.ProductImage[0].url}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-500 ${
                          hoveredProduct === product.id ? 'scale-110' : 'scale-100'
                        }`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gold-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gold-600">${product.price.toFixed(2)}</span>
                      <span className={`text-sm ${
                        product.stock > 5 ? 'text-green-600' : 
                        product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.stock > 5 ? 'In Stock' : 
                         product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleFavorite(product.id);
                    }}
                    disabled={favoriteLoading === product.id}
                    className={`p-2 rounded-full shadow-md transition-colors ${
                      favorites.includes(product.id)
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {favoriteLoading === product.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : (
                      <FiHeart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                    )}
                  </button>
                </div>
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addingToCart === product.id || product.stock === 0}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      product.stock === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : addingToCart === product.id
                        ? 'bg-gold-400 cursor-wait'
                        : 'bg-gold-600 hover:bg-gold-700 hover:shadow-lg'
                    }`}
                  >
                    {addingToCart === product.id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Adding...</span>
                      </>
                    ) : product.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <FiShoppingCart />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
} 