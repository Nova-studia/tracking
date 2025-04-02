import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Truck, ChevronDown, ChevronUp, Car, MapPin, Calendar, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PhotoViewModal from './PhotoViewModal';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

// Componente de tarjeta de vehículo (sin cambios)
const VehicleCard = ({ vehicle, onViewPhotos }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      loading: 'bg-purple-100 text-purple-800 border-purple-200',
      'in-transit': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    };

    const textMap = {
      pending: 'PENDIENTE',
      assigned: 'ASIGNADO',
      loading: 'CARGADO',
      'in-transit': 'EN TRÁNSITO',
      delivered: 'ENTREGADO'
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-md border ${styles[status]}`}>
        {textMap[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      {/* Header - Always visible */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-slate-500" />
              </div>
            </div>
            <span className="font-semibold text-slate-800">{vehicle.brand} {vehicle.model}</span>
            <div className="ml-auto">
              {getStatusBadge(vehicle.status)}
            </div>
          </div>
          <div className="flex flex-wrap items-center mt-2">
            <div className="flex items-center mr-3">
              <span className="text-xs text-slate-500">LOT: {vehicle.LOT}</span>
            </div>
            <div className="flex items-center mr-3">
              <Calendar className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-xs text-slate-500">{formatDate(vehicle.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-xs text-slate-500 truncate max-w-[160px]">{vehicle.lotLocation}</span>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="mt-4 mb-4 bg-slate-50 p-3 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-xs text-slate-600">
                <span className="font-medium">PIN:</span> {vehicle.PIN || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Subasta:</span> {vehicle.auctionHouse}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Año:</span> {vehicle.year || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Creado:</span> {new Date(vehicle.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPhotos(vehicle.loadingPhotos);
                }}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm transition-all border border-slate-200 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ver Fotos del Vehículo
              </button>
            )}
            
            {vehicle.travelComments && vehicle.travelComments.length > 0 && (
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                  <h3 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentarios de Viaje
                  </h3>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {vehicle.travelComments.map((comment, idx) => (
                    <div key={idx} className="p-3 border-b border-slate-100 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {comment.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de paginación
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center mt-6 space-x-1">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md ${
            currentPage === page 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md ${currentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

const ClientDashboard = ({ clientId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isViewPhotoModalOpen, setIsViewPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  
  // Nuevos estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    const fetchClientVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch(`${API_URL}/clients/my-vehicles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar vehículos');
        }

        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error('Error fetching client vehicles:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientVehicles();
    }
  }, [clientId]);

  // Resetear a la primera página cuando cambie el filtro o la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Filtrar vehículos por pestaña activa y búsqueda
  const filteredVehicles = () => {
    let filtered = vehicles;
    
    // Filtrar por estado (pestaña)
    if (activeTab !== 'all') {
      filtered = filtered.filter(v => v.status === activeTab);
    }
    
    // Filtrar por búsqueda (número de lote)
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(v => 
        v.LOT.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Obtener vehículos paginados
  const paginatedVehicles = () => {
    const filtered = filteredVehicles();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(filteredVehicles().length / itemsPerPage);

  // Manejar cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll hacia arriba para mejor UX
    window.scrollTo(0, 0);
  };

  // Contar vehículos por estado
  const counts = {
    all: vehicles.length,
    pending: vehicles.filter(v => v.status === 'pending').length,
    assigned: vehicles.filter(v => v.status === 'assigned').length,
    loading: vehicles.filter(v => v.status === 'loading').length,
    'in-transit': vehicles.filter(v => v.status === 'in-transit').length,
    delivered: vehicles.filter(v => v.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md shadow-sm hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Portal de Cliente</h1>
        <p className="text-slate-600 mt-1">Monitoreo de vehículos en transporte</p>
      </div>

      {/* Buscador por número de lote */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por número de lote"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
          />
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex overflow-x-auto pb-2 mb-6 gap-2">
        {[
          { id: 'all', label: 'Todos', count: counts.all },
          { id: 'pending', label: 'Pendientes', count: counts.pending },
          { id: 'assigned', label: 'Asignados', count: counts.assigned },
          { id: 'loading', label: 'En Carga', count: counts.loading },
          { id: 'in-transit', label: 'En Tránsito', count: counts['in-transit'] },
          { id: 'delivered', label: 'Entregados', count: counts.delivered }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id 
              ? 'bg-slate-800 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Información de resultados */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">
          Mostrando {paginatedVehicles().length} de {filteredVehicles().length} vehículos
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-slate-500">
            Página {currentPage} de {totalPages}
          </p>
        )}
      </div>

      {/* Lista de vehículos */}
      <div className="space-y-4">
        {paginatedVehicles().length > 0 ? (
          paginatedVehicles().map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onViewPhotos={(photos) => {
                setSelectedPhotos(photos);
                setIsViewPhotoModalOpen(true);
              }}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500">
              {searchQuery ? 'No se encontraron vehículos con ese número de lote' : 'No hay vehículos en esta categoría'}
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal para ver fotos */}
      <PhotoViewModal
        isOpen={isViewPhotoModalOpen}
        onClose={() => {
          setIsViewPhotoModalOpen(false);
          setSelectedPhotos(null);
        }}
        photos={selectedPhotos}
      />
    </div>
  );
};

ClientDashboard.propTypes = {
  clientId: PropTypes.string.isRequired
};

export default ClientDashboard;