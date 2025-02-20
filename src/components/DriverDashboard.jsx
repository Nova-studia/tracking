import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PhotoUploadModal from './PhotoUploadModal';
import PhotoViewModal from './PhotoViewModal';
import CommentsModal from './CommentsModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Camera, Truck } from 'lucide-react';

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
      
      // Automatically update status to loading after successful photo upload
      await onStatusUpdate(vehicle._id, 'loading', 'Fotos cargadas y vehículo listo para transporte');
      
      onPhotoUpload(updatedVehicle);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-slate-900">
          {vehicle.brand} {vehicle.model}
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          vehicle.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : 
          vehicle.status === 'loading' ? 'bg-orange-100 text-orange-800' : 
          'bg-green-100 text-green-800'
        }`}>
          {vehicle.status === 'assigned' ? 'ASIGNADO' :
           vehicle.status === 'loading' ? 'EN CARGA' : 'EN TRÁNSITO'}
        </span>
      </div>
      
      <div className="text-sm text-slate-600 space-y-2 mb-4">
        <p><span className="font-medium">LOT:</span> {vehicle.LOT}</p>
        <p><span className="font-medium">PIN:</span> {vehicle.PIN || '-'}</p>
        <p><span className="font-medium">Subasta:</span> {vehicle.auctionHouse}</p>
        <p><span className="font-medium">Ubicación:</span> {vehicle.lotLocation}</p>
        <p><span className="font-medium">Cliente:</span> {vehicle.clientId?.name}</p>
        {vehicle.year && <p><span className="font-medium">Año:</span> {vehicle.year}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {vehicle.status === 'assigned' && (
          <button
            onClick={() => onPhotoUpload()}
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
              onClick={() => onViewPhotos(vehicle.loadingPhotos)}
              className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
            >
              Ver Fotos
            </button>
          )}
          <button
            onClick={() => onCommentsOpen(vehicle)}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            Comentarios
          </button>
        </div>
      </div>
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
      
      // Automatically update status to loading
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

  const handleCommentUpdate = async (vehicleId, newComments) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedVehicleForComments.status,
          comment: newComments[newComments.length - 1].comment
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

      setIsCommentsModalOpen(false);
      setSelectedVehicleForComments(null);

    } catch (error) {
      console.error('Error updating comments:', error);
      alert('Error al actualizar comentarios: ' + error.message);
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-slate-900">Panel de Conductor</h1>
        <p className="text-sm text-slate-600 mt-1">
          {currentTrips.length} viajes activos · {completedTrips.length} completados
        </p>
      </div>

      {/* Active Trips */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Viajes Activos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentTrips.map((vehicle) => (
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
          ))}
          
          {currentTrips.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
              No hay viajes activos
            </div>
          )}
        </div>
      </div>

      {/* Completed Trips */}
      <div>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Historial de Entregas</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-100">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">LOT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">PIN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Subasta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedTrips.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {format(new Date(vehicle.updatedAt), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.LOT}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.PIN || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.auctionHouse}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.clientId?.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.lotLocation}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedPhotos(vehicle.loadingPhotos);
                            setIsViewPhotoModalOpen(true);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Ver Fotos
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedVehicleForComments(vehicle);
                          setIsCommentsModalOpen(true);
                        }}
                        className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Comentarios
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {completedTrips.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No hay entregas completadas
            </div>
          )}
        </div>
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
  driverId: PropTypes.string.isRequired
};

export default DriverDashboard;