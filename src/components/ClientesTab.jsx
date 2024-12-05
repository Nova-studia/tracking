import React, { useState } from 'react';

const ClientesTab = ({ clients, onAddClient }) => {
  const [newClient, setNewClient] = useState({
    name: '',
    phoneNumber: '',
  });

  const handleSubmit = () => {
    if (!newClient.name || !newClient.phoneNumber) {
      alert('Por favor complete todos los campos');
      return;
    }

    onAddClient(newClient);
    setNewClient({
      name: '',
      phoneNumber: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Agregar Nuevo Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Cliente"
            value={newClient.name}
            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={newClient.phoneNumber}
            onChange={(e) => setNewClient({...newClient, phoneNumber: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Agregar Cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client, index) => (
  <div key={client._id || index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">{client.name}</h3>
              <p className="text-slate-600">📞 {client.phoneNumber}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientesTab;