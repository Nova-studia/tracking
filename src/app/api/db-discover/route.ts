import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

interface CollectionInfo {
  name: string;
  count: number;
  hasTargetLots: boolean;
  sampleDocs: unknown[];
}

interface DatabaseResult {
  name: string;
  sizeOnDisk?: number;
  collections: CollectionInfo[];
  error?: string;
}

export async function GET() {
  try {
    console.log('🔍 Discovering all databases in cluster...');
    
    const baseUri = process.env.MONGODB_URI?.replace(/\/[^\/]*\?/, '/?') || '';
    console.log('🔗 Connecting to admin database...');
    
    const connection = await mongoose.createConnection(baseUri);
    if (!connection.db) {
      throw new Error('Failed to connect to database');
    }
    const admin = connection.db.admin();
    
    // List all databases
    const { databases } = await admin.listDatabases();
    console.log(`📊 Found ${databases.length} databases`);
    
    const results = [];
    const targetLots = ['98879846', 'JDIDBFJF', '65654654'];
    
    for (const dbInfo of databases) {
      try {
        console.log(`🔍 Checking database: ${dbInfo.name}`);
        const db = connection.useDb(dbInfo.name);
        
        // List collections in this database
        const collections = await (db.listCollections() as unknown as { toArray(): Promise<{ name: string }[]> }).toArray();
        const dbResult: DatabaseResult = {
          name: dbInfo.name,
          sizeOnDisk: dbInfo.sizeOnDisk,
          collections: []
        };
        
        for (const colInfo of collections) {
          try {
            const collection = db.collection(colInfo.name);
            const count = await collection.countDocuments();
            
            let hasTargetLots = false;
            let sampleDocs: unknown[] = [];
            
            if (count > 0) {
              // Check if this collection has our target lots
              const targetCheck = await collection.find({
                lot_number: { $in: targetLots }
              }).limit(3).toArray();
              
              hasTargetLots = targetCheck.length > 0;
              
              // Get sample documents
              sampleDocs = await collection.find({})
                .project({ lot_number: 1, full_name: 1, timestamp: 1, _id: 0 })
                .sort({ timestamp: -1 })
                .limit(5)
                .toArray();
            }
            
            dbResult.collections.push({
              name: colInfo.name,
              count,
              hasTargetLots,
              sampleDocs
            });
            
            if (hasTargetLots) {
              console.log(`🎯 FOUND TARGET LOTS in ${dbInfo.name}.${colInfo.name}!`);
            }
            
          } catch (colError) {
            console.log(`❌ Error checking collection ${colInfo.name}:`, colError);
          }
        }
        
        results.push(dbResult);
        
      } catch (dbError) {
        console.log(`❌ Error checking database ${dbInfo.name}:`, dbError);
        results.push({
          name: dbInfo.name,
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
      }
    }
    
    await connection.close();
    
    return NextResponse.json({
      success: true,
      targetLots,
      totalDatabases: databases.length,
      results: results.filter(r => !('error' in r) && r.collections && r.collections.length > 0)
    });
    
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}