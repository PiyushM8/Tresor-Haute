'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PressForm from '../../components/admin/PressForm';

interface PressContent {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
}

export default function AdminPressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pressContent, setPressContent] = useState<PressContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/signin');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchPressContent = async () => {
      try {
        const response = await fetch('/api/press');
        if (response.ok) {
          const data = await response.json();
          setPressContent(data);
        }
      } catch (error) {
        console.error('Error fetching press content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchPressContent();
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Press Management</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage press content and announcements
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {pressContent ? 'Edit Press Content' : 'Add Press Content'}
            </h2>
            <PressForm initialData={pressContent || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
} 