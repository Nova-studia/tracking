import React, { useState } from 'react';
import ClientAutocomplete from './ClientAutocomplete';

const ClientEditModal = ({ isOpen, onClose, onSubmit, vehicle, clients }) => {
  const [selectedClientId, setSelectedClientId] = useState(vehicle?.clientId?._id || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit(selectedClientId);
      onClose();
    } catch (error) {
      alert('Error al actualizar cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cambiar Cliente</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vehículo: {vehicle?.brand} {vehicle?.model} (LOT: {vehicle?.LOT})
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Nuevo Cliente
          </label>
          <ClientAutocomplete
            clients={clients}
            value={selectedClientId}
            onChange={setSelectedClientId}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !selectedClientId}
          >
            {loading ? 'Actualizando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientEditModal;