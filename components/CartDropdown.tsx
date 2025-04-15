'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDropdown() {
  const { items, showNotification, setShowNotification } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let cleanupTimer: NodeJS.Timeout;

    if (showNotification) {
      setIsVisible(true);
      timer = setTimeout(() => {
        setIsVisible(false);
        cleanupTimer = setTimeout(() => {
          setShowNotification(false);
        }, 300);
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [showNotification, setShowNotification]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Added to Cart</h3>
            <div className="space-y-4">
              {items.slice(-3).map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <Image
                      src={item.image || '/images/placeholder.png'}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-gold-600">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 3 && (
              <p className="text-sm text-gray-500 mt-2">+{items.length - 3} more items</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gold-600">${total.toFixed(2)}</span>
              </div>
              <Link
                href="/cart"
                className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-600 hover:bg-gold-700"
              >
                View Cart
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 