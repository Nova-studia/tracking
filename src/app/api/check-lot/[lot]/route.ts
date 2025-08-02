import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lot: string }> }
) {
  try {
    await connectDB();
    
    const { lot } = await params;
    const lotNumber = decodeURIComponent(lot).toUpperCase();
    
    if (lotNumber.length !== 8) {
      return NextResponse.json({
        available: false,
        message: 'El número de lote debe tener exactamente 8 dígitos'
      });
    }
    
    const existingContract = await Contract.findOne(
      { lot_number: lotNumber },
      { _id: 1 }
    ).lean();
    
    if (existingContract) {
      return NextResponse.json({
        available: false,
        message: 'Este número de lote ya ha sido registrado'
      });
    } else {
      return NextResponse.json({
        available: true,
        message: 'Número de lote disponible'
      });
    }
    
  } catch (error) {
    console.error('Error checking lot number:', error);
    return NextResponse.json(
      { error: 'Error verificando el número de lote' },
      { status: 500 }
    );
  }
}