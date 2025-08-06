import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Agregar usuarios únicos con sus contratos
    const users = await Contract.aggregate([
      {
        $group: {
          _id: "$phone_number",
          full_name: { $first: "$full_name" },
          address: { $first: "$address" },
          gatepass: { $first: "$gatepass" },
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
        $sort: { last_contract: -1 }
      },
      {
        $project: {
          _id: 0,
          phone_number: "$_id",
          full_name: 1,
          address: 1,
          gatepass: 1,
          contracts: 1,
          contract_count: 1,
          first_contract: 1,
          last_contract: 1
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}