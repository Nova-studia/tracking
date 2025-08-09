import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: contractId } = await params;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return NextResponse.json(
        { error: 'ID de contrato inválido' },
        { status: 400 }
      );
    }

    // Buscar el contrato
    const contract = await Contract.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(contract, { status: 200 });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: contractId } = await params;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return NextResponse.json(
        { error: 'ID de contrato inválido' },
        { status: 400 }
      );
    }

    // Verificar si el contrato existe
    const existingContract = await Contract.findById(contractId);

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el contrato
    await Contract.findByIdAndDelete(contractId);

    return NextResponse.json(
      { message: 'Contrato eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}