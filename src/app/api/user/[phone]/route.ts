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
    
    // Get user with all contracts
    const userAggregation = await Contract.aggregate([
      {
        $match: { phone_number: phoneNumber }
      },
      {
        $group: {
          _id: "$phone_number",
          full_name: { $first: "$full_name" },
          address: { $first: "$address" },
          gatepass: { $first: "$gatepass" },
          owner_name: { $first: "$owner_name" },
          owner_phone: { $first: "$owner_phone" },
          contracts: {
            $push: {
              _id: "$_id",
              lot_number: "$lot_number",
              signature_data: "$signature_data",
              timestamp: "$timestamp",
              ip_address: "$ip_address"
            }
          },
          contract_count: { $sum: 1 },
          first_contract: { $min: "$timestamp" },
          last_contract: { $max: "$timestamp" }
        }
      },
      {
        $project: {
          _id: 0,
          phone_number: "$_id",
          full_name: 1,
          address: 1,
          gatepass: 1,
          owner_name: 1,
          owner_phone: 1,
          contracts: 1,
          contract_count: 1,
          first_contract: 1,
          last_contract: 1
        }
      }
    ]);

    if (!userAggregation || userAggregation.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userAggregation[0];
    
    // Sort contracts by timestamp (newest first)
    user.contracts.sort((a: { timestamp: string }, b: { timestamp: string }) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { success: false, error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}