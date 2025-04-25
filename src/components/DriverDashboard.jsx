import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import CommentsModal from './CommentsModal';
import PhotoViewModal from './PhotoViewModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Truck, ChevronDown, ChevronUp, Car, MapPin, Calendar, User, ArrowRight } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

// Componente que muestra la tarjeta individual de vehículo
const VehicleCard = ({ vehicle, allVehicles, onViewPhotos, onCommentsOpen, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status) => {
    const styles = {
      assigned: 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-200',
      loading: 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-200',
      'in-transit': 'bg-gradient-to-r from-indigo-400 to-indigo-500 shadow-indigo-200',
      delivered: 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200'
    };

    const textMap = {
      assigned: 'ASIGNADO',
      loading: 'CARGADO',
      'in-transit': 'EN TRÁNSITO',
      delivered: 'ENTREGADO'
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-md shadow-sm ${styles[status]} text-white backdrop-blur-sm`}>
        {textMap[status]}
      </span>
    );
  };

  // Formatear la fecha para mostrar día de la semana
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Botón para iniciar viaje (modificado para manejar tanto assigned como loading)
  const StartTripButton = () => {
    const [isUpdating, setIsUpdating] = useState(false);

    // Función para verificar si es el último vehículo por cargar
    const isLastVehicleToLoad = () => {
      // Filtramos los vehículos que están asignados (no en carga ni en tránsito)
      const assignedVehicles = allVehicles.filter(v => v.status === 'assigned');
      // Si solo queda este vehículo, es el último
      return assignedVehicles.length === 1 && assignedVehicles[0]._id === vehicle._id;
    };

    const handleStartTrip = async () => {
      setIsUpdating(true);
      try {
        // Verificar si es el último vehículo
        if (vehicle.status === 'assigned' && isLastVehicleToLoad()) {
          // Primero cambiamos este a en tránsito
          await onStatusUpdate(vehicle._id, 'in-transit', 'Iniciando viaje');
          
          // Esperar un momento para asegurarnos que se procesó
          setTimeout(async () => {
            // Luego cambiar todos los demás vehículos que estén en loading a en tránsito
            const loadingVehicles = allVehicles.filter(v => v.status === 'loading');
            
            for (const v of loadingVehicles) {
              await onStatusUpdate(v._id, 'in-transit', 'Iniciando viaje de todos los vehículos');
            }
          }, 1000);
        } else {
          // Si no es el último o ya estaba en loading, solo cambiar a en tránsito
          await onStatusUpdate(vehicle._id, 'in-transit', 'Iniciando viaje');
        }
      } catch (error) {
        alert('Error al iniciar viaje: ' + error.message);
      } finally {
        setIsUpdating(false);
      }
    };

    // Mostrar el botón cuando el vehículo está en estado assigned o loading
    if (vehicle.status !== 'assigned' && vehicle.status !== 'loading') {
      return null;
    }

    return (
      <button
        onClick={handleStartTrip}
        disabled={isUpdating}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-md shadow-sm shadow-blue-200 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
      >
        <Truck className="w-4 h-4" />
        {isUpdating ? 'Actualizando...' : 'Iniciar Viaje'}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-3 backdrop-blur-sm hover:shadow-md transition-all duration-200">
      {/* Header - Always visible, solo el arrow tiene onClick */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="h-10 w-10 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center shadow-sm">
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
              <span className="text-xs text-slate-500">{formatDate(vehicle.assignedAt || vehicle.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-xs text-slate-500 truncate max-w-[160px]">{vehicle.lotLocation}</span>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all duration-200 ml-2"
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
                <span className="font-medium">Cliente:</span> {vehicle.clientId?.name}
              </p>
              {vehicle.year && (
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Año:</span> {vehicle.year}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Solo mostramos el botón de iniciar viaje */}
            <StartTripButton />

            <div className="flex gap-2">
              {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPhotos(vehicle.loadingPhotos);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 text-xs transition-all duration-200 backdrop-blur-sm border border-slate-200"
                >
                  Ver Fotos
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentsOpen(vehicle);
                }}
                className="flex-1 px-3 py-2 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 text-xs transition-all duration-200 backdrop-blur-sm border border-slate-200 flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                Comentarios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DriverDashboard = ({ driverId, setNotifications }) => {
  const [activeTab, setActiveTab] = useState('current');
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrips, setCurrentTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [isViewPhotoModalOpen, setIsViewPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedVehicleForComments, setSelectedVehicleForComments] = useState(null);

  // Función para centralizar la actualización de vehículos
  const refreshVehicleData = useCallback((updatedVehicle) => {
    if (!updatedVehicle || !updatedVehicle._id) {
      console.error('refreshVehicleData: Invalid vehicle data', updatedVehicle);
      return;
    }
    
    console.log('Actualizando listas con vehículo:', updatedVehicle._id, updatedVehicle.status);
    
    setAssignedVehicles(prev => 
      prev.map(v => v._id === updatedVehicle._id ? updatedVehicle : v)
    );
    
    // Si el vehículo está en viajes actuales, actualizar esa lista
    if (['assigned', 'loading', 'in-transit'].includes(updatedVehicle.status)) {
      setCurrentTrips(prev => {
        // Si ya existe el vehículo en la lista, actualizarlo
        if (prev.some(v => v._id === updatedVehicle._id)) {
          return prev.map(v => v._id === updatedVehicle._id ? updatedVehicle : v);
        } 
        // Si no existe pero debería estar en la lista, agregarlo
        else {
          return [...prev, updatedVehicle];
        }
      });
      
      // Asegurarse que no esté en la lista de completados
      setCompletedTrips(prev => prev.filter(v => v._id !== updatedVehicle._id));
    } else if (updatedVehicle.status === 'delivered') {
      // Si el vehículo está entregado, moverlo a completados
      setCurrentTrips(prev => prev.filter(v => v._id !== updatedVehicle._id));
      setCompletedTrips(prev => {
        if (prev.some(v => v._id === updatedVehicle._id)) {
          return prev.map(v => v._id === updatedVehicle._id ? updatedVehicle : v);
        } else {
          return [updatedVehicle, ...prev];
        }
      });
    }
  }, []);

  useEffect(() => {
    const fetchAssignedVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        console.log('Obteniendo vehículos asignados para conductor:', driverId);
        
        const response = await fetch(`${API_URL}/vehicles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar vehículos');
        }

        const vehicles = await response.json();
        console.log('Vehículos obtenidos:', vehicles.length);
        
        const allAssigned = vehicles.filter(v => 
          v.driverId?._id === driverId || v.driverId === driverId
        );
        
        console.log('Vehículos asignados a este conductor:', allAssigned.length);
        
        setAssignedVehicles(allAssigned);
        
        setCurrentTrips(allAssigned.filter(v => 
          ['assigned', 'loading', 'in-transit'].includes(v.status)
        ));
        
        setCompletedTrips(allAssigned.filter(v => 
          v.status === 'delivered'
        ));

      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchAssignedVehicles();
    }
  }, [driverId]);

  const handleStatusUpdate = async (vehicleId, newStatus, comment) => {
    try {
      console.log(`Actualizando estado de vehículo ${vehicleId} a ${newStatus} con comentario: ${comment}`);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          comment: comment
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el estado');
      }

      const updatedVehicle = await response.json();
      console.log('Vehículo actualizado correctamente:', updatedVehicle);

      // Usar la función centralizada para actualizar todas las listas
      refreshVehicleData(updatedVehicle);

      return updatedVehicle;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleCommentUpdate = async (vehicleId, newComment) => {
    try {
      if (!newComment?.trim()) {
        throw new Error('El comentario es requerido');
      }
  
      const selectedVehicle = assignedVehicles.find(v => v._id === vehicleId);
      if (!selectedVehicle) {
        throw new Error('Vehículo no encontrado');
      }
  
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedVehicle.status,
          comment: newComment.trim()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar comentarios');
      }
  
      const updatedVehicle = await response.json();
  
      // Usar la función centralizada para actualizar
      refreshVehicleData(updatedVehicle);
  
      // ELIMINAR ESTA PARTE: No crear la notificación localmente, solo depender del backend
      // Las notificaciones se actualizarán cuando se refresque la página
      
      return updatedVehicle;
    } catch (error) {
      console.error('Error updating comments:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
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
            className="mt-4 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Panel de Conductor</h1>
        <div className="flex items-center mt-2">
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 px-2.5 py-1 rounded-md text-xs text-white font-medium shadow-sm mr-2">
            {currentTrips.length} viajes activos
          </div>
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 px-2.5 py-1 rounded-md text-xs text-white font-medium shadow-sm">
            {completedTrips.length} completados
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'current'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Viajes Activos
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Historial
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'current' ? (
          currentTrips.length > 0 ? (
            currentTrips.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                allVehicles={currentTrips}
                onViewPhotos={(photos) => {
                  setSelectedPhotos(photos);
                  setIsViewPhotoModalOpen(true);
                }}
                onCommentsOpen={(vehicle) => {
                  setSelectedVehicleForComments(vehicle);
                  setIsCommentsModalOpen(true);
                }}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500">No hay viajes activos</p>
            </div>
          )
        ) : completedTrips.length > 0 ? (
          completedTrips.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              allVehicles={completedTrips}
              onViewPhotos={(photos) => {
                setSelectedPhotos(photos);
                setIsViewPhotoModalOpen(true);
              }}
              onCommentsOpen={(vehicle) => {
                setSelectedVehicleForComments(vehicle);
                setIsCommentsModalOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500">No hay viajes completados</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <PhotoViewModal
        isOpen={isViewPhotoModalOpen}
        onClose={() => {
          setIsViewPhotoModalOpen(false);
          setSelectedPhotos(null);
        }}
        photos={selectedPhotos}
      />

      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          setSelectedVehicleForComments(null);
        }}
        onSubmit={handleCommentUpdate}
        vehicle={selectedVehicleForComments}
      />
    </div>
  );
};

DriverDashboard.propTypes = {
  driverId: PropTypes.string.isRequired,
  setNotifications: PropTypes.func.isRequired
};

export default DriverDashboard;