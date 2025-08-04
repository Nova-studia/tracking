import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('🔍 Searching for correct database...');
    
    const baseUri = process.env.MONGODB_URI?.split('?')[0] || '';
    const params = process.env.MONGODB_URI?.split('?')[1] || '';
    
    // List of possible database names to check
    const databases = [
      'test',
      'jmtracking', 
      'contracts',
      'production',
      'jorge',
      'logistics',
      'tracking',
      'minnesota'
    ];
    
    const results = [];
    
    for (const dbName of databases) {
      try {
        const uri = `${baseUri.replace(/\/[^\/]*$/, '')}/${dbName}?${params}`;
        console.log(`🔍 Checking database: ${dbName}`);
        
        const connection = await mongoose.createConnection(uri);
        
        const contractSchema = new mongoose.Schema({
          phone_number: String,
          lot_number: String,
          full_name: String,
          address: String,
          signature_data: String,
          timestamp: Date,
          ip_address: String
        });
        
        const Contract = connection.model('Contract', contractSchema);
        
        const count = await Contract.countDocuments();
        const contracts = await Contract.find({}, { lot_number: 1, full_name: 1, timestamp: 1 })
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();
        
        await connection.close();
        
        results.push({
          database: dbName,
          count,
          contracts: contracts.map(c => ({
            lot_number: c.lot_number,
            full_name: c.full_name,
            timestamp: c.timestamp
          })),
          hasTargetLots: contracts.some(c => 
            ['98879846', 'JDIDBFJF', '65654654'].includes(c.lot_number)
          )
        });
        
        console.log(`✅ ${dbName}: ${count} contracts`);
        
      } catch (error) {
        console.log(`❌ ${dbName}: ${error instanceof Error ? error.message : 'Error'}`);
        results.push({
          database: dbName,
          error: error instanceof Error ? error.message : 'Connection failed'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      searchResults: results,
      targetLots: ['98879846', 'JDIDBFJF', '65654654']
    });
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}