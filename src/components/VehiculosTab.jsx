import React, { useState } from 'react';

const VehiculosTab = ({ vehicles, clients, drivers, onAddVehicle, onUpdateStatus, onAssignDriver }) => {
  const [newVehicle, setNewVehicle] = useState({
    clientId: '',
    driverId: '',
    brand: '',
    model: '',
    year: '',
    LOT: '',
    lotLocation: '',
    status: 'pending'
  });

  const handleSubmit = async () => {
    try {
      if (!newVehicle.clientId || !newVehicle.brand || !newVehicle.model) {
        alert('Por favor complete los campos requeridos');
        return;
      }

      // Asegurarnos de no enviar driverId si está vacío
      const vehicleData = {
        ...newVehicle,
        driverId: newVehicle.driverId || null
      };

      await onAddVehicle(vehicleData);
      
      // Limpiar el formulario después de éxito
      setNewVehicle({
        clientId: '',
        driverId: '',
        brand: '',
        model: '',
        year: '',
        LOT: '',
        lotLocation: '',
        status: 'pending'
      });
    } catch (error) {
      alert('Error al crear vehículo: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-transit': 'bg-blue-100 text-blue-800 border-blue-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    };

    const labels = {
      pending: 'Pendiente',
      'in-transit': 'En Tránsito',
      delivered: 'Entregado'
    };

    return (
      <span className={`px-2 py-1 rounded text-sm border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Registrar Nuevo Vehículo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={newVehicle.clientId}
            onChange={(e) => setNewVehicle({...newVehicle, clientId: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
          >
            <option value="">Seleccionar Cliente</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={newVehicle.driverId}
            onChange={(e) => setNewVehicle({...newVehicle, driverId: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
          >
            <option value="">Asignar Driver (Opcional)</option>
            {drivers.map(driver => (
              <option key={driver._id} value={driver._id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Marca"
            value={newVehicle.brand}
            onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />

          <input
            type="text"
            placeholder="Modelo"
            value={newVehicle.model}
            onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />

          <input
            type="text"
            placeholder="Año"
            value={newVehicle.year}
            onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />

          <input
            type="text"
            placeholder="LOT"
            value={newVehicle.LOT}
            onChange={(e) => setNewVehicle({...newVehicle, LOT: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />

          <input
            type="text"
            placeholder="Ubicación de Subasta"
            value={newVehicle.lotLocation}
            onChange={(e) => setNewVehicle({...newVehicle, lotLocation: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />

          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Registrar Vehículo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Vehículos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-slate-900">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </h3>
                {getStatusBadge(vehicle.status)}
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">📌 LOT: {vehicle.LOT}</p>
                <p className="text-slate-600">📍 {vehicle.lotLocation}</p>
                <p className="text-slate-600">
                  👤 Cliente: {clients.find(c => c._id === vehicle.clientId)?.name}
                </p>
                {vehicle.driverId && (
                  <p className="text-slate-600">
                    🚘 Driver: {drivers.find(d => d._id === vehicle.driverId)?.name}
                  </p>
                )}
              </div>

              {/* Mostrar selector de conductor si está en estado pendiente */}
              {vehicle.status === 'pending' && (
                <div className="mt-4">
                  <select
                    value={vehicle.driverId || ''}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
                    onChange={async (e) => {
                      try {
                        await onAssignDriver(vehicle._id, e.target.value);
                      } catch (error) {
                        alert('Error al asignar conductor: ' + error.message);
                      }
                    }}
                  >
                    <option value="">Asignar Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mostrar botón de Iniciar Tránsito si tiene conductor y está pendiente */}
              {vehicle.driverId && vehicle.status === 'pending' && (
                <button
                  onClick={async () => {
                    try {
                      await onUpdateStatus(vehicle._id, 'in-transit');
                    } catch (error) {
                      alert('Error al actualizar estado: ' + error.message);
                    }
                  }}
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Iniciar Tránsito
                </button>
              )}

              {/* Mostrar botón de Marcar como Entregado si está en tránsito */}
              {vehicle.status === 'in-transit' && (
                <button
                  onClick={async () => {
                    try {
                      await onUpdateStatus(vehicle._id, 'delivered');
                    } catch (error) {
                      alert('Error al actualizar estado: ' + error.message);
                    }
                  }}
                  className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Marcar como Entregado
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehiculosTab;