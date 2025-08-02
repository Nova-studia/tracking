import connectDB from './mongodb';

// Array to store active SSE connections
let clients: Array<{ id: string; controller: ReadableStreamDefaultController }> = [];

// Function to send updates to a specific client
async function sendUpdate(controller: ReadableStreamDefaultController) {
  try {
    await connectDB();
    
    const Contract = (await import('../models/Contract')).default;
    const contracts = await Contract.find().sort({ createdAt: -1 });
    
    const transformedContracts = contracts.map(contract => ({
      id: contract._id.toString(),
      phone_number: contract.phone_number,
      lot_number: contract.lot_number,
      equipment_number: contract.equipment_number,
      equipment_type: contract.equipment_type,
      freight_rate: contract.freight_rate,
      type_of_service: contract.type_of_service,
      total_value: contract.total_value,
      contract_status: contract.contract_status,
      date: contract.date,
      truck_driver: contract.truck_driver,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      signatureData: contract.signatureData
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
    } catch {
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
    } catch {
      // Remove failed client
      clients = clients.filter(c => c.id !== client.id);
    }
  });
}

// Function to add a client to the list
export function addClient(client: { id: string; controller: ReadableStreamDefaultController }) {
  clients.push(client);
}

// Function to remove a client from the list
export function removeClient(clientId: string) {
  clients = clients.filter(client => client.id !== clientId);
}

// Function to get sendUpdate for the route
export { sendUpdate };