import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import VehiclesTableView from './VehiclesTableView';
import SearchBar from './SearchBar';
import ClientAutocomplete from './ClientAutocomplete';

const VehiculosTab = ({ vehicles, clients, drivers, onAddVehicle, onUpdateStatus, onAssignDriver }) => {
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    dateRange: 'all'
  });
  const [newVehicle, setNewVehicle] = useState({
    clientId: '',
    brand: '',
    model: '',
    year: '',
    LOT: '',
    lotLocation: '',
    city: '',
    state: '',
    status: 'pending'
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const searchText = filters.searchText.toLowerCase();
      const matchesSearch = filters.searchText === '' || 
        vehicle.LOT?.toLowerCase().includes(searchText) ||
        vehicle.brand?.toLowerCase().includes(searchText) ||
        vehicle.model?.toLowerCase().includes(searchText) ||
        vehicle.lotLocation?.toLowerCase().includes(searchText);

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

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [vehicles, filters]);

  const handleSubmit = async () => {
    if (!newVehicle.clientId || !newVehicle.brand || !newVehicle.model || !newVehicle.lotLocation) {
      alert('Por favor complete los campos requeridos:\n- Cliente\n- Marca\n- Modelo\n- Ubicación (Ciudad, Estado)');
      return;
    }

    try {
      const [city, state] = newVehicle.lotLocation.split(',').map(s => s.trim());
      
      if (!city || !state) {
        alert('La ubicación debe estar en formato: Ciudad, Estado');
        return;
      }

      const vehicleData = {
        ...newVehicle,
        city,
        state,
        lotLocation: `${city}, ${state}`
      };
      
      const response = await onAddVehicle(vehicleData);

      setNewVehicle({
        clientId: '',
        brand: '',
        model: '',
        year: '',
        LOT: '',
        lotLocation: '',
        city: '',
        state: '',
        status: 'pending'
      });
    } catch (error) {
      alert('Error al crear vehículo: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setNewVehicle(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-transit': 'bg-blue-100 text-blue-800 border-blue-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      pending: 'Pendiente',
      'in-transit': 'En Tránsito',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 rounded text-sm border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 p-2">
          <h2 className="font-semibold text-slate-900">Registrar Nuevo Vehículo</h2>
        </div>
        <div className="grid grid-cols-8 gap-px bg-slate-200">
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Cliente</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Marca</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Modelo</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Año</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">LOT</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Ubicación</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600 col-span-2">Acciones</div>

          <div className="bg-white p-1">
            <ClientAutocomplete
              clients={clients}
              value={newVehicle.clientId}
              onChange={(clientId) => handleInputChange('clientId', clientId)}
            />
          </div>

          <div className="bg-white p-1">
            <input
              type="text"
              value={newVehicle.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="Marca"
            />
          </div>

          <div className="bg-white p-1">
            <input
              type="text"
              value={newVehicle.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="Modelo"
            />
          </div>

          <div className="bg-white p-1">
            <input
              type="text"
              value={newVehicle.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="Año"
            />
          </div>

          <div className="bg-white p-1">
            <input
              type="text"
              value={newVehicle.LOT}
              onChange={(e) => handleInputChange('LOT', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="LOT"
            />
          </div>

          <div className="bg-white p-1">
            <input
              type="text"
              value={newVehicle.lotLocation}
              onChange={(e) => handleInputChange('lotLocation', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="Ciudad, Estado"
            />
          </div>

          <div className="bg-white p-1 col-span-2">
            <button
              onClick={handleSubmit}
              className="w-full px-2 py-1 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 transition-colors"
            >
              Registrar
            </button>
          </div>
        </div>
      </div>

      <SearchBar onSearch={setFilters} />

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Vista Tarjetas
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
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
                    {vehicle.brand} {vehicle.model} ({vehicle.year || '-'})
                  </h3>
                  {getStatusBadge(vehicle.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600">📌 LOT: {vehicle.LOT || '-'}</p>
                  <p className="text-slate-600">📍 {vehicle.lotLocation || `${vehicle.city || '-'}, ${vehicle.state || '-'}`}</p>
                  <p className="text-slate-600">
                    👤 Cliente: {clients.find(c => c._id === (typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId))?.name || '-'}
                  </p>
                  {vehicle.driverId && (
                    <p className="text-slate-600">
                      🚘 Conductor: {drivers.find(d => d._id === (typeof vehicle.driverId === 'object' ? vehicle.driverId._id : vehicle.driverId))?.name || '-'}
                    </p>
                  )}
                </div>

                {vehicle.status === 'pending' && (
                  <div className="mt-4">
                    <select
                      value={typeof vehicle.driverId === 'object' ? vehicle.driverId._id : (vehicle.driverId || '')}
                      onChange={(e) => onAssignDriver(vehicle._id, e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
                    >
                      <option value="">Asignar Conductor</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {vehicle.status === 'pending' && vehicle.driverId && (
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
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired
        })
      ]).isRequired,
      driverId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired
        })
      ]),
      brand: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      year: PropTypes.string,
      LOT: PropTypes.string,
      lotLocation: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'in-transit', 'delivered', 'cancelled']).isRequired,
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