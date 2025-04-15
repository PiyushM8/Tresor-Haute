const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create a test category
  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
    },
  });

  // Create a test product
  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      description: 'A test product for development',
      price: 99.99,
      stock: 10,
      category: category.name,
      categoryId: category.id,
      ProductImage: {
        create: {
          url: 'https://via.placeholder.com/300',
        },
      },
    },
  });

  console.log('Seed data created:', { category, product });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 