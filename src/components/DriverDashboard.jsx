import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PhotoUploadModal from './PhotoUploadModal';
import PhotoViewModal from './PhotoViewModal';
import CommentsModal from './CommentsModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Camera, Truck, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const StatusUpdate = ({ vehicle, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(vehicle._id, 'in-transit', 'Iniciando viaje');
      setIsUpdating(false);
    } catch (error) {
      alert('Error al actualizar el estado: ' + error.message);
      setIsUpdating(false);
    }
  };

  if (vehicle.status !== 'loading') {
    return null;
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={isUpdating}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <Truck className="w-4 h-4" />
      {isUpdating ? 'Actualizando...' : 'Iniciar Viaje'}
    </button>
  );
};

const VehicleCard = ({ vehicle, onPhotoUpload, onViewPhotos, onCommentsOpen, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (formData) => {
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicle._id}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir las fotos');
      }

      const updatedVehicle = await response.json();
      
      await onStatusUpdate(vehicle._id, 'loading', 'Fotos cargadas y vehículo listo para transporte');
      
      onPhotoUpload(updatedVehicle);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-green-400';
      case 'loading':
        return 'bg-cyan-300';
      case 'in-transit':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-black';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned':
        return 'ASIGNADO';
      case 'loading':
        return 'EN CARGA';
      case 'in-transit':
        return 'EN TRÁNSITO';
      case 'delivered':
        return 'ENTREGADO';
      default:
        return 'PENDIENTE';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{vehicle.brand} {vehicle.model}</span>
            <span className="text-sm text-slate-500">LOT: {vehicle.LOT}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-6 py-1.5 text-sm text-white rounded-sm ${getStatusColor(vehicle.status)}`}>
            {getStatusText(vehicle.status)}
          </span>
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
          <div className="text-sm text-slate-600 space-y-2 mt-4 mb-4">
            <p><span className="font-medium">Fecha de asignación:</span> {format(new Date(vehicle.createdAt), 'dd/MM/yyyy', { locale: es })}</p>
            <p><span className="font-medium">PIN:</span> {vehicle.PIN || '-'}</p>
            <p><span className="font-medium">Subasta:</span> {vehicle.auctionHouse}</p>
            <p><span className="font-medium">Ubicación:</span> {vehicle.lotLocation}</p>
            <p><span className="font-medium">Cliente:</span> {vehicle.clientId?.name}</p>
            {vehicle.year && <p><span className="font-medium">Año:</span> {vehicle.year}</p>}
          </div>

          <div className="flex flex-col gap-2">
            {vehicle.status === 'assigned' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotoUpload();
                }}
                disabled={isUploading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {isUploading ? 'Subiendo...' : 'Cargar Fotos'}
              </button>
            )}

            <StatusUpdate 
              vehicle={vehicle} 
              onUpdate={onStatusUpdate}
            />

            <div className="flex gap-2">
              {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPhotos(vehicle.loadingPhotos);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
                >
                  Ver Fotos
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentsOpen(vehicle);
                }}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
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
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isViewPhotoModalOpen, setIsViewPhotoModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedVehicleForComments, setSelectedVehicleForComments] = useState(null);

  useEffect(() => {
    const fetchAssignedVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

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
        
        const allAssigned = vehicles.filter(v => 
          v.driverId?._id === driverId || v.driverId === driverId
        );
        
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

      setAssignedVehicles(prev => 
        prev.map(v => v._id === vehicleId ? updatedVehicle : v)
      );

      if (newStatus === 'delivered') {
        setCurrentTrips(prev => prev.filter(v => v._id !== vehicleId));
        setCompletedTrips(prev => [updatedVehicle, ...prev]);
      } else {
        setCurrentTrips(prev => 
          prev.map(v => v._id === vehicleId ? updatedVehicle : v)
        );
      }

      return updatedVehicle;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handlePhotoSubmit = async (formData) => {
    try {
      if (!selectedVehicleId) {
        throw new Error('No hay vehículo seleccionado');
      }

      const token = localStorage.getItem('token');
      
      if (!formData || Array.from(formData.entries()).length === 0) {
        throw new Error('No se han seleccionado fotos');
      }

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicleId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir las fotos');
      }

      const updatedVehicle = await response.json();
      
      await handleStatusUpdate(selectedVehicleId, 'loading', 'Fotos cargadas y vehículo listo para transporte');
      
      setAssignedVehicles(prev => 
        prev.map(v => v._id === selectedVehicleId ? updatedVehicle : v)
      );

      setCurrentTrips(prev => 
        prev.map(v => v._id === selectedVehicleId ? updatedVehicle : v)
      );

      setIsPhotoModalOpen(false);
      setSelectedVehicleId('');

      return updatedVehicle;
    } catch (error) {
      console.error('Error uploading photos:', error);
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

      setAssignedVehicles(prev => 
        prev.map(v => v._id === vehicleId ? updatedVehicle : v)
      );

      setCurrentTrips(prev => 
        prev.map(v => v._id === vehicleId ? updatedVehicle : v)
      );

      // Crear la notificación local
      // Crear la notificación local
if (updatedVehicle) {
  const newNotification = {
    lotInfo: `${updatedVehicle.LOT || 'LOT'} - ${updatedVehicle.brand} ${updatedVehicle.model}`,
    message: newComment.trim(),
    vehicleId: vehicleId,
    image: updatedVehicle.loadingPhotos?.frontPhoto?.url || null,
    time: new Date().toLocaleString(),
    partnerGroup: updatedVehicle.partnerGroup // Añadir el grupo del vehículo
  };
  
  console.log('Creando notificación local con grupo:', updatedVehicle.partnerGroup);
  
  // Actualizar el estado local de notificaciones
  setNotifications(prev => [...prev, newNotification]);
}

      return updatedVehicle;
    } catch (error) {
      console.error('Error updating comments:', error);
      throw error;
    }
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
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
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
        <h1 className="text-xl font-medium text-slate-900">Panel de Conductor</h1>
        <p className="text-sm text-slate-600 mt-1">
          {currentTrips.length} viajes activos · {completedTrips.length} completados
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'current'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Viajes Activos
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 ${
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
                onPhotoUpload={() => {
                  setSelectedVehicleId(vehicle._id);
                  setIsPhotoModalOpen(true);
                }}
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
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
              No hay viajes activos
            </div>
          )
        ) : completedTrips.length > 0 ? (
          completedTrips.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onPhotoUpload={() => {
                setSelectedVehicleId(vehicle._id);
                setIsPhotoModalOpen(true);
              }}
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
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
            No hay viajes completados
          </div>
        )}
      </div>

      {/* Modals */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedVehicleId('');
        }}
        onSubmit={handlePhotoSubmit}
        vehicleId={selectedVehicleId}
      />

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