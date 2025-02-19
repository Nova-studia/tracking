import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { extractUniqueLotLocations, FilterDriversSelect } from '../service/headerTagCity';
import ClientAutocomplete from './ClientAutocomplete';
import SearchBar from './SearchBar';
import VehiclesTableView from './VehiclesTableView';

const VehiculosTab = ({ vehicles, setVehicles, clients, drivers, onAddVehicle, onUpdateStatus, onAssignDriver }) => {
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
    status: 'pending',
    comments: ''
  });

  const [localVehicles, setLocalVehicles] = useState(vehicles);

  React.useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return localVehicles.filter(vehicle => {
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
  }, [localVehicles, filters]);

  const handleSubmit = async () => {
    // Cambiamos la validación para no requerir clientId
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.lotLocation) {
      alert('Por favor complete los campos requeridos:\n- Marca\n- Modelo\n- Ubicación (Ciudad, Estado)');
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
        status: 'pending',
        clientId: newVehicle.clientId || null  // Permitimos que sea null
      };
      
      const createdVehicle = await onAddVehicle(vehicleData);
      setLocalVehicles(prev => [...prev, createdVehicle]);
  
      setNewVehicle({
        clientId: '',
        brand: '',
        model: '',
        year: '',
        LOT: '',
        lotLocation: '',
        city: '',
        state: '',
        status: 'pending',
        comments: ''
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

  const handleVehicleUpdate = (updatedVehicle) => {
    setLocalVehicles(prev => 
      prev.map(vehicle => 
        vehicle._id === updatedVehicle._id ? updatedVehicle : vehicle
      )
    );
  };

  const handleUpdateContentVehicle = async (vehicleId, vehicle) => {
    try {
      const updatedVehicle = await onUpdateStatus(vehicleId, vehicle);
      handleVehicleUpdate(updatedVehicle);
    } catch (error) {
      alert('Error al actualizar vehículo: ' + error.message);
    }
  }

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
      <div className="border-b border-slate-200">
          {
            extractUniqueLotLocations(vehicles).map((state, index) => (
              <button
                key={index}
                onClick={() => {
                  if(state === 'Todos'){
                    setFilters(prev => ({ ...prev, searchText: '' }));
                  }else{
                    setFilters(prev => ({ ...prev, searchText: state }));
                  }
                }}
                className="px-2 py-1 bg-slate-200 text-sm text-slate-900 rounded-full hover:bg-slate-100 transition-colors mr-2 mb-2"
              >
                {state}
              </button>
            ))
          }
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Vehículos</h2>
        <VehiclesTableView 
          vehicles={filteredVehicles}
          clients={clients}
          drivers={FilterDriversSelect(drivers, filters.searchText)}
          onAssignDriver={onAssignDriver}
          onUpdateStatus={onUpdateStatus}
          onVehicleUpdate={handleVehicleUpdate}
          setVehicles={setVehicles}
        />
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