import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { useRouter } from 'next/navigation';
import ProductList from '@/app/components/admin/ProductList';

export default async function AdminProductsListPage() {
  const session = await getServerSession(authOptions);
  const router = useRouter();

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    router.push('/signin');
    return null;
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Products</h1>
      <ProductList products={products} />
    </div>
  );
} 