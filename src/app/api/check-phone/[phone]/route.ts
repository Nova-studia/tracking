import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await connectDB();
    
    const { phone } = await params;
    const phoneNumber = decodeURIComponent(phone);
    
    const existingContract = await Contract.findOne(
      { phone_number: phoneNumber },
      { phone_number: 1, full_name: 1, address: 1 }
    )
    .sort({ timestamp: -1 })
    .lean();
    
    if (existingContract && !Array.isArray(existingContract)) {
      return NextResponse.json({
        exists: true,
        userData: {
          phone_number: existingContract.phone_number,
          full_name: existingContract.full_name,
          address: existingContract.address
        }
      });
    } else {
      return NextResponse.json({
        exists: false,
        userData: null
      });
    }
    
  } catch (error) {
    console.error('Error processing phone check:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}