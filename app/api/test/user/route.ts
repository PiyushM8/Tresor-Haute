import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await hash('testpassword123', 12),
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = testUser;

    return NextResponse.json({
      message: 'Test user created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { message: 'Error creating test user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all users to verify the database connection
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Database connection successful',
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Error fetching users', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 