import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET() {
  try {
    console.log('🧪 DB Test endpoint called');
    
    // Test connection
    const connection = await connectDB();
    console.log('✅ Connection established');
    
    // Get database stats
    const totalContracts = await Contract.countDocuments();
    const recentContracts = await Contract.find()
      .select('_id phone_number lot_number full_name timestamp')
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    // Get database info
    const dbName = connection?.connection?.name || 'unknown';
    const readyState = connection?.connection?.readyState || 0;
    
    const readyStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const readyStateText = readyStateMap[readyState] || 'unknown';
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV || 'development',
      database: {
        name: dbName,
        readyState: readyState,
        readyStateText: readyStateText,
        uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@') || 'Not set'
      },
      stats: {
        totalContracts,
        recentContracts: recentContracts.map(contract => ({
          id: (contract._id as { toString: () => string }).toString(),
          phone_number: contract.phone_number,
          lot_number: contract.lot_number,
          full_name: contract.full_name,
          timestamp: contract.timestamp
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ DB Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
      uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@') || 'Not set',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}