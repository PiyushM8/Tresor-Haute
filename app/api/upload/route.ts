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
      const errorDetails = {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
        message: 'Cloudinary configuration missing'
      };
      console.error('Cloudinary configuration error:', errorDetails);
      return NextResponse.json(
        { 
          error: 'Image upload service is not properly configured',
          details: errorDetails
        },
        { status: 500 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('Unauthorized upload attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file in upload request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', {
        type: file.type,
        name: file.name,
        size: file.size
      });
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
          details: {
            type: file.type,
            name: file.name,
            size: file.size
          }
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    console.log('Starting Cloudinary upload...', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, {
        folder: 'tresor-haute',
        resource_type: 'auto',
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', {
            error,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
          reject(error);
        } else {
          console.log('Cloudinary upload successful:', {
            result,
            fileName: file.name
          });
          resolve(result as CloudinaryUploadResult);
        }
      });
    });

    if (!uploadResult?.secure_url) {
      console.error('No secure_url in upload result:', {
        uploadResult,
        fileName: file.name
      });
      return NextResponse.json(
        { 
          error: 'Failed to get image URL from upload service',
          details: { uploadResult }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Upload error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error
        }
      },
      { status: 500 }
    );
  }
} 