import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const contractId = id;
    
    const contract = await Contract.findById(contractId)
      .select('signature_data lot_number')
      .lean();
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    console.log(`Revisando firma de número de lote: ${contract && !Array.isArray(contract) ? contract.lot_number : 'unknown'}`);
    
    return NextResponse.json({
      signatureData: contract && !Array.isArray(contract) ? contract.signature_data : null
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}