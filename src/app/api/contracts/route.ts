import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { notifyNewContract } from '@/lib/stream-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { phoneNumber, lotNumber, fullName, address, gatepass, ownerName, ownerPhone, signatureData } = body;
    
    console.log('📥 API received contract data:', { phoneNumber, lotNumber, fullName, address, gatepass: gatepass ? 'PROVIDED' : 'MISSING', ownerName, ownerPhone, signatureData: signatureData ? 'PROVIDED' : 'MISSING' });
    
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    if (!phoneNumber || !lotNumber || !gatepass || !ownerName || !ownerPhone || !signatureData) {
      const missing = [];
      if (!phoneNumber) missing.push('phoneNumber');
      if (!lotNumber) missing.push('lotNumber');
      if (!gatepass) missing.push('gatepass');
      if (!ownerName) missing.push('ownerName');
      if (!ownerPhone) missing.push('ownerPhone');
      if (!signatureData) missing.push('signatureData');
      
      console.log('❌ Missing required fields:', missing);
      
      return NextResponse.json(
        { error: `Campos faltantes: ${missing.join(', ')}. Todos los campos son requeridos.` },
        { status: 400 }
      );
    }

    if (lotNumber.length !== 8) {
      return NextResponse.json(
        { error: 'El número de lote debe tener exactamente 8 dígitos' },
        { status: 400 }
      );
    }

    if (gatepass.length > 6 || !/^[A-Z0-9]*$/.test(gatepass)) {
      return NextResponse.json(
        { error: 'El Gatepass debe tener máximo 6 caracteres alfanuméricos' },
        { status: 400 }
      );
    }

    // Check if lot number already exists
    const existingLot = await Contract.findOne({ lot_number: lotNumber.toUpperCase() });
    if (existingLot) {
      return NextResponse.json(
        { error: 'Este número de lote ya ha sido registrado. Por favor, verifique el número e intente con otro.' },
        { status: 409 }
      );
    }

    // Create new contract
    const contract = new Contract({
      phone_number: phoneNumber,
      lot_number: lotNumber.toUpperCase(),
      full_name: fullName,
      address: address,
      gatepass: gatepass,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      signature_data: signatureData,
      ip_address: ipAddress
    });

    const savedContract = await contract.save();

    // Notify all connected clients of the new contract
    notifyNewContract();

    return NextResponse.json({
      success: true,
      message: 'Contrato guardado exitosamente',
      contractId: savedContract._id
    });
    
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    
    // Handle MongoDB duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000 && 'keyPattern' in error && (error as { keyPattern?: { lot_number?: number } }).keyPattern?.lot_number) {
      return NextResponse.json(
        { error: 'Este número de lote ya ha sido registrado. Por favor, verifique el número e intente con otro.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    // Build search filter
    let filter = {};
    if (search) {
      filter = {
        lot_number: { $regex: search.toUpperCase(), $options: 'i' }
      };
    }
    
    // Get total count for pagination
    const total = await Contract.countDocuments(filter);
    
    // Get paginated results
    const contracts = await Contract.find(filter)
      .select('_id phone_number lot_number full_name address gatepass owner_name owner_phone timestamp')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Transform _id to id for frontend compatibility
    const transformedContracts = contracts.map(contract => ({
      id: (contract._id as { toString: () => string }).toString(),
      phone_number: contract.phone_number,
      lot_number: contract.lot_number,
      full_name: contract.full_name,
      address: contract.address,
      gatepass: contract.gatepass,
      owner_name: contract.owner_name,
      owner_phone: contract.owner_phone,
      timestamp: contract.timestamp
    }));

    return NextResponse.json({
      contracts: transformedContracts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}