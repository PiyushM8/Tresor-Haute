'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bars3Icon, XMarkIcon, ShoppingBagIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useCart } from '@/app/context/CartContext'
import CartDropdown from './CartDropdown'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, showNotification } = useCart()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setCartCount(items.reduce((total, item) => total + item.quantity, 0))
  }, [items])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleProfileClick = () => {
    router.push('/account')
  }

  const handleCartClick = () => {
    router.push('/cart')
  }

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="relative w-32 h-12">
                <Image
                  src="/images/logo.png"
                  alt="Tresor Haute"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/shop"
                className="border-transparent text-gold-600 hover:text-gold-500 hover:border-gold-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300 font-cormorant"
              >
                Shop
              </Link>
              <Link
                href="/collections"
                className="border-transparent text-gold-600 hover:text-gold-500 hover:border-gold-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300 font-cormorant"
              >
                Collections
              </Link>
              <Link
                href="/about"
                className="border-transparent text-gold-600 hover:text-gold-500 hover:border-gold-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300 font-cormorant"
              >
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Link
                  href="/cart"
                  className="relative p-1 rounded-full text-gold-600 hover:text-gold-500 transition-colors duration-300"
                >
                  <ShoppingBagIcon className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <CartDropdown />
              </div>
              {status === 'authenticated' ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleProfileClick}
                    className="ml-3 p-1 rounded-full text-gold-600 hover:text-gold-500 transition-colors duration-300"
                  >
                    <UserIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gold-600 hover:text-gold-500 flex items-center space-x-1"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleProfileClick}
                  className="text-gold-600 hover:text-gold-500"
                >
                  <UserIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gold-600 hover:text-gold-500 hover:bg-gold-100 transition-colors duration-300"
            >
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white/95 backdrop-blur-md">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/shop"
              className="border-transparent text-gold-600 hover:bg-gold-100 hover:text-gold-500 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-300 font-cormorant"
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className="border-transparent text-gold-600 hover:bg-gold-100 hover:text-gold-500 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-300 font-cormorant"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="border-transparent text-gold-600 hover:bg-gold-100 hover:text-gold-500 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-300 font-cormorant"
            >
              About
            </Link>
            <Link
              href="/cart"
              className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-gold-600 hover:text-gold-500 hover:bg-gold-50"
            >
              <ShoppingBagIcon className="h-6 w-6 mr-2" />
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            {status === 'authenticated' ? (
              <>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gold-600 hover:bg-gold-100 hover:text-gold-500"
                >
                  Account
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gold-600 hover:bg-gold-100 hover:text-gold-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleProfileClick}
                className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gold-600 hover:bg-gold-100 hover:text-gold-500"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 