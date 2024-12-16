import React, { useState, useMemo } from 'react';
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
      // Por defecto, no mostrar los vehículos entregados a menos que se seleccione específicamente
      if (vehicle.status === 'delivered' && filters.status !== 'delivered') {
        return false;
      }
  
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
        lotLocation: `${city}, ${state}`,
        status: 'pending'
      };
      
      await onAddVehicle(vehicleData);

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
    if (field === 'LOT') {
      if (value.length > 8) return;
      if (!/^[A-Za-z0-9]*$/.test(value)) return;
      const lotExists = vehicles.some(vehicle => vehicle.LOT === value);
      if (lotExists) {
        alert('Este número de LOT ya existe');
        return;
      }
    }
    setNewVehicle(prev => ({ ...prev, [field]: value }));
  };

  // Componente de Vista de Viajes
  const TripsView = () => {
    // Agrupar vehículos por conductor
    const groupedVehicles = React.useMemo(() => {
      const groups = {
        unassigned: []
      };
      
      filteredVehicles.forEach(vehicle => {
        const driverId = typeof vehicle.driverId === 'object' ? 
          vehicle.driverId._id : 
          vehicle.driverId;

        if (!driverId) {
          groups.unassigned.push(vehicle);
        } else {
          if (!groups[driverId]) {
            groups[driverId] = [];
          }
          groups[driverId].push(vehicle);
        }
      });

      return groups;
    }, [filteredVehicles]);

    const getStatusBadge = (status) => {
      const styles = {
        pending: 'bg-red-100 text-red-800',
        assigned: 'bg-yellow-100 text-yellow-800',
        loading: 'bg-orange-100 text-orange-800',
        'in-transit': 'bg-green-100 text-green-800',
        delivered: 'bg-blue-100 text-blue-800'
      };

      const labels = {
        pending: 'Pendiente',
        assigned: 'Asignado',
        loading: 'En Carga',
        'in-transit': 'En Tránsito',
        delivered: 'Entregado'
      };

      return (
        <span className={`${styles[status]} px-2 py-1 rounded-full text-xs font-medium`}>
          {labels[status]}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {/* Sección de vehículos sin asignar */}
        {groupedVehicles.unassigned.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-red-800">
                Sin Conductor Asignado ({groupedVehicles.unassigned.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {groupedVehicles.unassigned.map(vehicle => (
                <div key={vehicle._id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">
                        {vehicle.brand} {vehicle.model} ({vehicle.year || '-'})
                      </h3>
                      <span className="text-sm text-slate-500">LOT: {vehicle.LOT || '-'}</span>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  <div className="text-sm text-slate-600 mb-3">
                    <p>📍 {vehicle.lotLocation || `${vehicle.city}, ${vehicle.state}`}</p>
                    <p>👤 Cliente: {clients.find(c => c._id === (typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId))?.name || '-'}</p>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      onAssignDriver(vehicle._id, e.target.value);
                      if (e.target.value) {
                        setTimeout(() => onUpdateStatus(vehicle._id, 'assigned'), 100);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">Asignar conductor...</option>
                    {drivers
                      .filter(driver => driver.isActive)
                      .map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secciones por conductor */}
        {drivers.map(driver => {
          const driverVehicles = groupedVehicles[driver._id] || [];
          if (driverVehicles.length === 0) return null;

          return (
            <div key={driver._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  {driver.name} ({driverVehicles.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {driverVehicles.map(vehicle => (
                  <div key={vehicle._id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {vehicle.brand} {vehicle.model} ({vehicle.year || '-'})
                        </h3>
                        <span className="text-sm text-slate-500">LOT: {vehicle.LOT || '-'}</span>
                      </div>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    <div className="text-sm text-slate-600 mb-3">
                      <p>📍 {vehicle.lotLocation || `${vehicle.city}, ${vehicle.state}`}</p>
                      <p>👤 Cliente: {clients.find(c => c._id === (typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId))?.name || '-'}</p>
                    </div>
                    {vehicle.status !== 'delivered' && (
                      <div className="flex justify-end">
                        {vehicle.status === 'assigned' && (
                          <button
                            onClick={() => onUpdateStatus(vehicle._id, 'loading')}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                          >
                            Iniciar Carga
                          </button>
                        )}
                        {vehicle.status === 'loading' && (
                          <button
                            onClick={() => onUpdateStatus(vehicle._id, 'in-transit')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                          >
                            Iniciar Viaje
                          </button>
                        )}
                        {vehicle.status === 'in-transit' && (
                          <button
                            onClick={() => onUpdateStatus(vehicle._id, 'delivered')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                          >
                            Marcar como Entregado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.values(groupedVehicles).every(group => group.length === 0) && (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-600">No hay vehículos que coincidan con los filtros</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Registro */}
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
onClick={() => setViewMode('trips')}
className={`px-4 py-2 rounded-lg ${viewMode === 'trips' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
>
Vista Viajes
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
<TripsView />
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
status: PropTypes.oneOf(['pending', 'assigned', 'loading', 'in-transit', 'delivered']).isRequired,
createdAt: PropTypes.string,
updatedAt: PropTypes.string
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