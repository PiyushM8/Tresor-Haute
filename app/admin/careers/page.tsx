'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CareerForm from '../../components/admin/CareerForm';
import CareerList from '../../components/admin/CareerList';

interface Career {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  createdAt: string;
}

export default function AdminCareersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/signin');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const response = await fetch('/api/careers');
        if (response.ok) {
          const data = await response.json();
          setCareers(data);
        }
      } catch (error) {
        console.error('Error fetching careers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchCareers();
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
    <div className="min-h-screen bg-offwhite py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Career Management</h1>
            <p className="mt-2 text-sm text-gray-500">
              Add, edit, or remove career opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Career</h2>
              <CareerForm />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Careers</h2>
              <CareerList careers={careers} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 