'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error uploading product:', error);
      alert('Failed to upload product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload New Product</h1>
          <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
