import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { extractUniqueLotLocations, FilterDriversSelect } from '../service/headerTagCity';
import ClientAutocomplete from './ClientAutocomplete';
import SearchBar from './SearchBar';
import VehiclesTableView from './VehiclesTableView';

const VehiculosTab = ({ 
  vehicles, 
  setVehicles, 
  clients, 
  drivers, 
  onAddVehicle, 
  onUpdateStatus, 
  onAssignDriver, 
  onDeleteVehicle,
  setNotifications  // Nueva prop
}) => {
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    dateRange: 'all'
  });
  
  const [selectedState, setSelectedState] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    clientId: '',
    brand: '',
    model: '',
    year: '',
    LOT: '',
    PIN: '',
    auctionHouse: 'Copart',
    lotLocation: '',
    city: '',
    state: '',
    status: 'pending',
    comments: ''
  });

  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const [isFormOpen, setIsFormOpen] = useState(false);

  React.useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    // Si no hay estado seleccionado, retornar array vacío
    if (!selectedState || selectedState === '') {
      return [];
    }

    return localVehicles.filter(vehicle => {
      // Filtrar por estado seleccionado (si no es 'Todos')
      if (selectedState !== 'Todos' && !vehicle.state.includes(selectedState)) {
        return false;
      }

      // Filtrar por texto de búsqueda
      const searchText = filters.searchText.toLowerCase();
      const matchesSearch = filters.searchText === '' || 
        vehicle.LOT?.toLowerCase().includes(searchText) ||
        vehicle.PIN?.toLowerCase().includes(searchText) ||
        vehicle.brand?.toLowerCase().includes(searchText) ||
        vehicle.model?.toLowerCase().includes(searchText) ||
        vehicle.lotLocation?.toLowerCase().includes(searchText);

      // Si hay texto de búsqueda y coincide, mostrar el vehículo sin importar su estado
      if (filters.searchText !== '' && matchesSearch) {
        return true;
      }

      // Si no hay búsqueda específica, ocultar entregados a menos que se seleccione específicamente
      if (vehicle.status === 'delivered' && filters.status !== 'delivered') {
        return false;
      }

      // Filtrar por status (si hay uno seleccionado)
      if (filters.status && vehicle.status !== filters.status) {
        return false;
      }

      // Filtrar por fecha
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

      return matchesSearch && matchesDate;
    });
}, [localVehicles, filters, selectedState]);

  const handleSubmit = async () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.lotLocation || !newVehicle.auctionHouse) {
      alert('Por favor complete los campos requeridos:\n- Marca\n- Modelo\n- Ubicación (Ciudad, Estado)\n- Casa de Subasta');
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
        clientId: newVehicle.clientId || null
      };
      
      const createdVehicle = await onAddVehicle(vehicleData);
      setLocalVehicles(prev => [...prev, createdVehicle]);
      setIsFormOpen(false);
  
      setNewVehicle({
        clientId: '',
        brand: '',
        model: '',
        year: '',
        LOT: '',
        PIN: '',
        auctionHouse: 'Copart',
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

  return (
    <div className="space-y-6">
      {/* Botón móvil para mostrar/ocultar formulario */}
      <div className="md:hidden">
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          {isFormOpen ? 'Cerrar formulario' : 'Registrar Nuevo Vehículo'}
        </button>
      </div>

      {/* Formulario de Registro */}
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${isFormOpen ? 'block' : 'hidden md:block'}`}>
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900 text-lg">Registrar Nuevo Vehículo</h2>
        </div>
        
        {/* Formulario móvil */}
        <div className="md:hidden p-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Cliente</label>
            <ClientAutocomplete
              clients={clients}
              value={newVehicle.clientId}
              onChange={(clientId) => handleInputChange('clientId', clientId)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Casa de Subasta</label>
            <select
              value={newVehicle.auctionHouse}
              onChange={(e) => handleInputChange('auctionHouse', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="Copart">Copart</option>
              <option value="IAA">IAA</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Marca</label>
            <input
              type="text"
              value={newVehicle.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Marca del vehículo"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Modelo</label>
            <input
              type="text"
              value={newVehicle.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Modelo del vehículo"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Año</label>
            <input
              type="text"
              value={newVehicle.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Año del vehículo"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">LOT</label>
            <input
              type="text"
              value={newVehicle.LOT}
              onChange={(e) => handleInputChange('LOT', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Número de LOT"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">PIN</label>
            <input
              type="text"
              value={newVehicle.PIN}
              onChange={(e) => handleInputChange('PIN', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Número de PIN"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Ubicación</label>
            <input
              type="text"
              value={newVehicle.lotLocation}
              onChange={(e) => handleInputChange('lotLocation', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              placeholder="Ciudad, Estado"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors mt-4"
          >
            Registrar Vehículo
          </button>
        </div>

        {/* Formulario desktop */}
        <div className="hidden md:grid grid-cols-9 gap-px bg-slate-200">
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Cliente</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Subasta</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Marca</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Modelo</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Año</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">LOT</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">PIN</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Ubicación</div>
          <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600">Acciones</div>

          <div className="bg-white p-1">
            <ClientAutocomplete
              clients={clients}
              value={newVehicle.clientId}
              onChange={(clientId) => handleInputChange('clientId', clientId)}
            />
          </div>

          <div className="bg-white p-1">
            <select
              value={newVehicle.auctionHouse}
              onChange={(e) => handleInputChange('auctionHouse', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
            >
              <option value="Copart">Copart</option>
              <option value="IAA">IAA</option>
              <option value="Otra">Otra</option>
            </select>
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
              value={newVehicle.PIN}
              onChange={(e) => handleInputChange('PIN', e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
              placeholder="PIN"
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

          <div className="bg-white p-1">
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
  <button
    onClick={() => {
      setSelectedState('Todos');
      setFilters(prev => ({ ...prev, searchText: '' }));
    }}
    className={`px-2 py-1 ${
      selectedState === 'Todos' 
        ? 'bg-slate-900 text-white' 
        : 'bg-slate-200 text-slate-900'
    } text-sm rounded-full hover:bg-slate-800 hover:text-white transition-colors mr-2 mb-2`}
  >
    Todos
  </button>
  {
    extractUniqueLotLocations(vehicles)
      .filter(state => state !== 'Todos')
      .map((state, index) => (
        <button
          key={index}
          onClick={() => {
            setSelectedState(state);
            setFilters(prev => ({ ...prev, searchText: state }));
          }}
          className={`px-2 py-1 ${
            selectedState === state 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-200 text-slate-900'
          } text-sm rounded-full hover:bg-slate-800 hover:text-white transition-colors mr-2 mb-2`}
        >
          {state}
        </button>
      ))
  }
</div>
      <div className="bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-slate-900">
  {selectedState ? (selectedState === 'Todos' ? 'Lista de Todos los Vehículos' : `Lista de Vehículos - ${selectedState}`) : 'Seleccione un estado para ver los vehículos'}
</h2>
        {selectedState ? (
          <VehiclesTableView 
          vehicles={filteredVehicles}
          clients={clients}
          drivers={FilterDriversSelect(drivers, filters.searchText)}
          onAssignDriver={onAssignDriver}
          onUpdateStatus={(vehicleId, status, comment) => onUpdateStatus(vehicleId, status, comment)}
          onVehicleUpdate={handleVehicleUpdate}
          onDeleteVehicle={onDeleteVehicle}
          setVehicles={setVehicles}
          setNotifications={setNotifications}  // Agregar esta línea
        />
        ) : (
          <div className="text-center py-8 text-slate-500">
            Por favor, seleccione un estado para ver los vehículos disponibles
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
      PIN: PropTypes.string,
      auctionHouse: PropTypes.oneOf(['Copart', 'IAA', 'Otra']).isRequired,
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
  onDeleteVehicle: PropTypes.func.isRequired,
  setVehicles: PropTypes.func.isRequired,
  setNotifications: PropTypes.func.isRequired,
};

export default VehiculosTab;