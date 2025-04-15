import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/app/context/CartContext';
import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { items } = useCart();
  const [showCount, setShowCount] = useState(false);

  const handleCartClick = () => {
    setShowCount(true);
    setTimeout(() => setShowCount(false), 2000);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Tresor Haute</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/shop"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/shop'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-700 hover:text-white"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span
                  className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                    showCount ? 'animate-bounce' : ''
                  }`}
                >
                  {items.length}
                </span>
              )}
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-700 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 