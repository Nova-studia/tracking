import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

// Global variable to store connected clients
let clients: { id: string; controller: ReadableStreamDefaultController }[] = [];

export async function GET(request: NextRequest) {
  const clientId = Math.random().toString(36).substring(7);
  
  const stream = new ReadableStream({
    start(controller) {
      // Add client to the list
      clients.push({ id: clientId, controller });
      
      // Send initial data
      sendUpdate(controller);
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: {"type":"heartbeat"}\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clients = clients.filter(client => client.id !== clientId);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

async function sendUpdate(controller: ReadableStreamDefaultController) {
  try {
    await connectDB();
    
    const contracts = await Contract.find()
      .select('_id phone_number lot_number full_name address timestamp')
      .sort({ timestamp: -1 })
      .lean();
    
    const transformedContracts = contracts.map(contract => ({
      id: contract._id.toString(),
      phone_number: contract.phone_number,
      lot_number: contract.lot_number,
      full_name: contract.full_name,
      address: contract.address,
      timestamp: contract.timestamp
    }));

    controller.enqueue(`data: ${JSON.stringify({ type: 'contracts', data: transformedContracts })}\n\n`);
  } catch (error) {
    console.error('Error sending update:', error);
  }
}

// Function to notify all clients of new data
export function notifyClients() {
  clients.forEach(client => {
    try {
      sendUpdate(client.controller);
    } catch (error) {
      // Remove failed client
      clients = clients.filter(c => c.id !== client.id);
    }
  });
}

// Function to notify all clients of a new contract
export function notifyNewContract() {
  clients.forEach(client => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify({ type: 'new_contract' })}\n\n`);
    } catch (error) {
      // Remove failed client
      clients = clients.filter(c => c.id !== client.id);
    }
  });
}