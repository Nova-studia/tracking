const Client = require('../models/Client');

const clientService = {
  async createClient(clientData) {
    try {
      const client = new Client(clientData);
      return await client.save();
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  },

  async getAllClients() {
    try {
      return await Client.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }
};
