'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../components/layout/PageHeader';

export default function PressPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual email subscription logic here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen">
      <PageHeader 
        title="Press & Media"
        subtitle="Stay updated with our latest news and announcements"
        backgroundImage="/images/press-header.jpg"
      />
      
      <section className="mx-auto max-w-4xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="mb-6 text-3xl font-bold">Coming Soon</h2>
          <p className="mb-8 text-lg text-gray-600">
            Our press page is currently under construction. Sign up below to receive updates
            and be the first to know when we launch.
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {isLoading ? 'Subscribing...' : 'Notify Me'}
                </button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-green-50 p-4 text-green-800"
            >
              <p>Thank you for your interest! We'll notify you when our press page launches.</p>
            </motion.div>
          )}

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              For immediate press inquiries, please contact us at:{' '}
              <a
                href="mailto:press@tresor-haute.com"
                className="text-black underline hover:text-gray-800"
              >
                press@tresor-haute.com
              </a>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
} 