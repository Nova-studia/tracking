import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PhotoUploadModal from './PhotoUploadModal';
import PhotoViewModal from './PhotoViewModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const StatusUpdateWithComment = ({ vehicle, onUpdate, className = '' }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [comment, setComment] = useState('');

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      assigned: 'loading',
      loading: 'in-transit',
      'in-transit': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const getButtonText = (status) => {
    const textMap = {
      assigned: 'CARGAR VEHÍCULO',
      loading: 'INICIAR VIAJE',
      'in-transit': 'MARCAR ENTREGADO'
    };
    return textMap[status];
  };

  const getButtonColor = (status) => {
    const colorMap = {
      assigned: 'bg-orange-600 hover:bg-orange-700',
      loading: 'bg-green-600 hover:bg-green-700',
      'in-transit': 'bg-blue-600 hover:bg-blue-700'
    };
    return colorMap[status];
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Por favor, añade un comentario antes de actualizar el estado');
      return;
    }
    
    setIsUpdating(true);
    try {
      await onUpdate(vehicle._id, getNextStatus(vehicle.status), comment);
      setComment('');
      setIsUpdating(false);
    } catch (error) {
      alert('Error al actualizar el estado: ' + error.message);
      setIsUpdating(false);
    }
  };

  if (vehicle.status === 'delivered') {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Añadir comentario del viaje..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={handleSubmit}
          disabled={isUpdating || !comment.trim()}
          className={`px-4 py-2 text-white rounded transition-colors ${getButtonColor(vehicle.status)} disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
        >
          {isUpdating ? 'Actualizando...' : getButtonText(vehicle.status)}
        </button>
      </div>
      {vehicle.travelComments && vehicle.travelComments.length > 0 && (
        <div className="mt-2 space-y-2">
          {vehicle.travelComments.map((comment, index) => (
            <div key={index} className="text-sm bg-slate-50 p-2 rounded">
              <div className="flex justify-between items-start">
                <div className="font-medium text-slate-600">
                  {format(new Date(comment.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                  {comment.status}
                </span>
              </div>
              <p className="mt-1 text-slate-700">{comment.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DriverDashboard = ({ driverId }) => {
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrips, setCurrentTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isViewPhotoModalOpen, setIsViewPhotoModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  useEffect(() => {
    const fetchAssignedVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch('http://localhost:5000/api/vehicles', {
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
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/status`, {
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
      
      // Verificar que formData contiene todas las fotos requeridas
      let hasAllPhotos = true;
      ['frontPhoto', 'backPhoto', 'leftPhoto', 'rightPhoto'].forEach(key => {
        if (!formData.has(key)) {
          hasAllPhotos = false;
        }
      });

      if (!hasAllPhotos) {
        throw new Error('Se requieren las 4 fotos');
      }

      const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicleId}/photos`, {
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
      
      setAssignedVehicles(prev => 
        prev.map(v => v._id === selectedVehicleId ? updatedVehicle : v)
      );

      setCurrentTrips(prev => 
        prev.map(v => v._id === selectedVehicleId ? updatedVehicle : v)
      );

      setIsPhotoModalOpen(false);
      setSelectedVehicleId('');

    } catch (error) {
      console.error('Error in photo submission:', error);
      alert('Error al procesar las fotos: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'loading': return 'bg-orange-100 text-orange-800';
      case 'in-transit': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned': return 'ASIGNADO';
      case 'loading': return 'EN CARGA';
      case 'in-transit': return 'EN TRÁNSITO';
      case 'delivered': return 'ENTREGADO';
      default: return 'DESCONOCIDO';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error: {error}</p>
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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Conductor</h1>
        <p className="text-slate-600">
          Tienes {currentTrips.length} viajes activos y {completedTrips.length} completados
        </p>
      </div>

      {/* Viajes Activos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Viajes Activos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentTrips.map((vehicle) => (
            <div key={vehicle._id} className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-slate-900">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-slate-600">
                <p><span className="font-medium">LOT:</span> {vehicle.LOT}</p>
                <p><span className="font-medium">Ubicación:</span> {vehicle.lotLocation}</p>
                <p><span className="font-medium">Cliente:</span> {vehicle.clientId?.name}</p>
                {vehicle.year && <p><span className="font-medium">Año:</span> {vehicle.year}</p>}
              </div>

              {vehicle.status === 'assigned' ? (
                <button
                  onClick={() => {
                    setSelectedVehicleId(vehicle._id);
                    setIsPhotoModalOpen(true);
                  }}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  CARGAR VEHÍCULO
                </button>
              ) : (
                <StatusUpdateWithComment
                  vehicle={vehicle}
                  onUpdate={handleStatusUpdate}
                  className="mt-4"
                />
              )}

              {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                <button
                  onClick={() => {
                    setSelectedPhotos(vehicle.loadingPhotos);
                    setIsViewPhotoModalOpen(true);
                  }}
                  className="w-full mt-2 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
                >
                  Ver Fotos
                </button>
              )}
            </div>
          ))}
          
          {currentTrips.length === 0 && (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600">No tienes viajes activos en este momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Viajes Completados */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Historial de Entregas</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    LOT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Comentarios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fotos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {completedTrips.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {format(new Date(vehicle.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{vehicle.LOT}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{vehicle.clientId?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{vehicle.lotLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vehicle.status)}`}>
                        {getStatusText(vehicle.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-xs">
                        {vehicle.travelComments && vehicle.travelComments.length > 0 && (
                          <div className="space-y-1">
                            {vehicle.travelComments.map((comment, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">
                                  {format(new Date(comment.createdAt), "HH:mm", { locale: es })}:
                                </span>
                                {" "}{comment.comment}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedPhotos(vehicle.loadingPhotos);
                            setIsViewPhotoModalOpen(true);
                          }}
                          className="px-3 py-1 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
                        >
                          Ver Fotos
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {completedTrips.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                No hay entregas completadas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de subida de fotos */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedVehicleId('');
        }}
        on
        onSubmit={handlePhotoSubmit}
        vehicleId={selectedVehicleId}
      />

      {/* Modal de vista de fotos */}
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

DriverDashboard.propTypes = {
  driverId: PropTypes.string.isRequired
};

export default DriverDashboard;