import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const careers = await prisma.career.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(careers);
  } catch (error) {
    console.error('Error fetching careers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch careers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, location, type } = body;

    if (!title || !description || !location || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const career = await prisma.career.create({
      data: {
        title,
        description,
        location,
        type,
      },
    });

    return NextResponse.json(career);
  } catch (error) {
    console.error('Error creating career:', error);
    return NextResponse.json(
      { error: 'Failed to create career' },
      { status: 500 }
    );
  }
} 