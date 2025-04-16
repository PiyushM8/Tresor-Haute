import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({
        status: 'error',
        message: 'Cloudinary configuration missing',
        config: {
          cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: !!process.env.CLOUDINARY_API_KEY,
          apiSecret: !!process.env.CLOUDINARY_API_SECRET
        }
      });
    }

    // Test Cloudinary connection
    const testResult = await cloudinary.api.ping();
    
    return NextResponse.json({
      status: 'success',
      message: 'Cloudinary configuration is valid',
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKeyPresent: !!process.env.CLOUDINARY_API_KEY,
        apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET
      },
      testResult
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    }, { status: 500 });
  }
} 