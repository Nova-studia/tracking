import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import VehiclesTableView from './VehiclesTableView';
import SearchBar from './SearchBar';

const VehiculosTab = ({ vehicles, clients, drivers, onAddVehicle, onUpdateStatus, onAssignDriver }) => {
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    dateRange: 'all'
  });
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

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = filters.searchText === '' || 
        vehicle.LOT?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(filters.searchText.toLowerCase());

      const matchesStatus = filters.status === '' || vehicle.status === filters.status;

      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const vehicleDate = new Date(vehicle.createdAt);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            matchesDate = vehicleDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = vehicleDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            matchesDate = vehicleDate >= monthAgo;
            break;
          default:
            break;
        }
      }

      // Excluir vehículos entregados si no están específicamente filtrados
      const showDelivered = filters.status === 'delivered';
      const isNotDelivered = vehicle.status !== 'delivered' || showDelivered;

      return matchesSearch && matchesStatus && matchesDate && isNotDelivered;
    });
  }, [vehicles, filters]);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSubmit = async () => {
    if (!newVehicle.clientId || !newVehicle.brand || !newVehicle.model) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      await onAddVehicle({
        ...newVehicle,
        driverId: newVehicle.driverId || null
      });
      
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

      <SearchBar onSearch={handleSearch} />

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'grid' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          Vista Tarjetas
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'table' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          Vista Tabla
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Vehículos</h2>
        
        {viewMode === 'table' ? (
          <VehiclesTableView 
            vehicles={filteredVehicles}
            clients={clients}
            drivers={drivers}
            onAssignDriver={onAssignDriver}
            onUpdateStatus={onUpdateStatus}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredVehicles.map(vehicle => (
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

                {vehicle.status === 'pending' && (
                  <div className="mt-4">
                    <select
                      value={vehicle.driverId || ''}
                      onChange={(e) => onAssignDriver(vehicle._id, e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
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

                {vehicle.driverId && vehicle.status === 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(vehicle._id, 'in-transit')}
                    className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Iniciar Tránsito
                  </button>
                )}

                {vehicle.status === 'in-transit' && (
                  <button
                    onClick={() => onUpdateStatus(vehicle._id, 'delivered')}
                    className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Marcar como Entregado
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

VehiculosTab.propTypes = {
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      clientId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ]).isRequired,
      driverId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ]),
      brand: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      year: PropTypes.string,
      LOT: PropTypes.string,
      lotLocation: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'in-transit', 'delivered']).isRequired,
    })
  ).isRequired,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAddVehicle: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onAssignDriver: PropTypes.func.isRequired,
};

export default VehiculosTab;