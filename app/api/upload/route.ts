import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing:', {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      return NextResponse.json(
        { error: 'Image upload service is not properly configured' },
        { status: 500 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    console.log('Starting Cloudinary upload...');
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, {
        folder: 'tresor-haute',
        resource_type: 'auto',
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload successful:', result);
          resolve(result as CloudinaryUploadResult);
        }
      });
    });

    if (!uploadResult?.secure_url) {
      console.error('No secure_url in upload result:', uploadResult);
      return NextResponse.json(
        { error: 'Failed to get image URL from upload service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 