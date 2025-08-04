import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Connect to test database
    const testUri = process.env.MONGODB_URI?.replace('/jmtracking?', '/test?') || '';
    const prodUri = process.env.MONGODB_URI || '';
    
    console.log('📊 Connecting to test database...');
    const testConnection = await mongoose.createConnection(testUri);
    
    console.log('📊 Connecting to jmtracking database...');
    const prodConnection = await mongoose.createConnection(prodUri);
    
    // Define contract schema for both connections
    const contractSchema = new mongoose.Schema({
      phone_number: String,
      lot_number: String,
      full_name: String,
      address: String,
      signature_data: String,
      timestamp: Date,
      ip_address: String
    });
    
    const TestContract = testConnection.model('Contract', contractSchema);
    const ProdContract = prodConnection.model('Contract', contractSchema);
    
    // Get all contracts from test database
    const testContracts = await TestContract.find({}).lean();
    console.log(`📋 Found ${testContracts.length} contracts in test database`);
    
    // Get existing contracts in production database
    const existingLots = await ProdContract.find({}, { lot_number: 1 }).lean();
    const existingLotNumbers = new Set(existingLots.map(c => c.lot_number));
    
    // Filter out contracts that already exist in production
    const contractsToMigrate = testContracts.filter(contract => 
      !existingLotNumbers.has(contract.lot_number)
    );
    
    console.log(`📦 Migrating ${contractsToMigrate.length} new contracts...`);
    
    if (contractsToMigrate.length > 0) {
      // Insert contracts to production database
      await ProdContract.insertMany(contractsToMigrate);
      console.log('✅ Migration completed successfully');
    } else {
      console.log('ℹ️ No new contracts to migrate');
    }
    
    // Get final counts
    const testCount = await TestContract.countDocuments();
    const prodCount = await ProdContract.countDocuments();
    
    // Close connections
    await testConnection.close();
    await prodConnection.close();
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        testDatabase: testCount,
        prodDatabase: prodCount,
        migrated: contractsToMigrate.length
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}