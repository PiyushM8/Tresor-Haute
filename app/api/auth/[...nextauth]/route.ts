import NextAuth from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 