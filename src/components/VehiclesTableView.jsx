import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pencil, Trash2, ChevronDown, ChevronUp, Car, MapPin, Calendar, User, ArrowRight, MessageSquare } from 'lucide-react';
import ClientEditModal from './ClientEditModal';
import PhotoViewModal from './PhotoViewModal';
import CommentsModal from './CommentsModal';
import DriverSelectModal from './DriverSelectModal';
import VehicleItem from './VehicleItem';

const VehiclesTableView = ({ 
  vehicles, 
  clients, 
  drivers, 
  onAssignDriver, 
  onUpdateStatus,
  onVehicleUpdate,
  onDeleteVehicle,  
  setVehicles,
  setNotifications
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [vehicleForDriverAssignment, setVehicleForDriverAssignment] = useState(null);

  const handleUpdateComment = async (vehicleId, newComment) => {
    try {
      const API_URL = `${process.env.REACT_APP_API_URL}/api`;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
    
      const selectedVehicle = vehicles.find(v => v._id === vehicleId);
      if (!selectedVehicle) {
        throw new Error('Vehículo no encontrado');
      }
    
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedVehicle.status,
          comment: newComment,
          travelComments: [...(selectedVehicle.travelComments || []), {
            comment: newComment,
            status: selectedVehicle.status,
            createdAt: new Date()
          }]
        })
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar comentarios');
      }
    
      const updatedVehicle = await response.json();
      onVehicleUpdate(updatedVehicle);
      
      // ELIMINAR ESTAS LÍNEAS: No crear la notificación localmente
      // La notificación ya se crea en el backend y se recuperará al actualizar la página
      
      return updatedVehicle;
    
    } catch (error) {
      console.error('Error updating comments:', error);
      throw new Error('Error al actualizar comentarios');
    }
  };
  
  const handleUpdateClient = async (clientId) => {
    try {
      const API_URL = `${process.env.REACT_APP_API_URL}/api`;
      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}/client`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ clientId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedVehicle = await response.json();
      onVehicleUpdate(updatedVehicle);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const openDriverModal = (vehicle) => {
    setVehicleForDriverAssignment(vehicle);
    setIsDriverModalOpen(true);
  };

  const handleDriverSelect = (driverId) => {
    if (vehicleForDriverAssignment) {
      onAssignDriver(vehicleForDriverAssignment._id, driverId);
      
      if (vehicleForDriverAssignment.status === 'pending') {
        setTimeout(() => {
          onUpdateStatus(vehicleForDriverAssignment._id, 'assigned', 'Conductor asignado al vehículo');
        }, 100);
      }
      
      setVehicleForDriverAssignment(null);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) {
      try {
        await onDeleteVehicle(vehicleId);
      } catch (error) {
        alert('Error al eliminar vehículo: ' + error.message);
      }
    }
  };

  const openPhotoModal = (photos) => {
    setSelectedPhotos(photos);
    setIsPhotoModalOpen(true);
  };

  const openCommentsModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsCommentsModalOpen(true);
  };

  const openClientModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsClientModalOpen(true);
  };

  const groupedVehicles = React.useMemo(() => {
    const groups = {
      unassigned: []
    };

    const sortedVehicles = [...vehicles].sort((a, b) => {
      const priority = { 
        pending: 0, 
        assigned: 1, 
        loading: 2, 
        'in-transit': 3, 
        delivered: 4 
      };
      return priority[a.status] - priority[b.status];
    });

    sortedVehicles.forEach(vehicle => {
      let driverId = null;
      
      if (vehicle.driverId) {
        if (typeof vehicle.driverId === 'object' && vehicle.driverId !== null) {
          driverId = vehicle.driverId._id;
        } else if (typeof vehicle.driverId === 'string') {
          driverId = vehicle.driverId;
        }
      }

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
  }, [vehicles]);

  // Utility functions
  const getClientName = (vehicle) => {
    if (!vehicle?.clientId) return '-';
    const clientId = typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId;
    return clients.find(c => c._id === clientId)?.name || '-';
  };

  const getLocation = (vehicle) => {
    return vehicle.lotLocation || 
      (vehicle.city && vehicle.state ? `${vehicle.city}, ${vehicle.state}` : '-');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Monochrome status badges with minimal design
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-black text-white',
      assigned: 'bg-gray-700 text-white',
      loading: 'bg-gray-600 text-white',
      'in-transit': 'bg-gray-500 text-white',
      delivered: 'bg-gray-400 text-white'
    };

    const textMap = {
      pending: 'PENDIENTE',
      assigned: 'ASIGNADO',
      loading: 'CARGADO',
      'in-transit': 'EN TRÁNSITO',
      delivered: 'ENTREGADO'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
        {textMap[status]}
      </span>
    );
  };

  // Simplified progress bar
  const getProgressBar = (status) => {
    const percentages = {
      pending: '20%',
      assigned: '40%',
      loading: '60%',
      'in-transit': '80%',
      delivered: '100%'
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="h-1.5 rounded-full bg-black" 
          style={{ width: percentages[status] }}
        ></div>
      </div>
    );
  };

  // Vehicle Group Table Component
  const VehicleGroupTable = ({ vehicles, groupTitle, className }) => (
    <div className={`bg-white rounded border border-gray-200 overflow-hidden mb-4 ${className}`}>
      <div className="border-b border-gray-200">
        <div className="w-full bg-gray-50 px-4 py-3 flex items-center">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-700 truncate" title={groupTitle}>
              {groupTitle}
            </h3>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {['pending', 'assigned', 'loading', 'in-transit', 'delivered'].map(status => {
                const count = vehicles.filter(v => v.status === status).length;
                if (count === 0) return null;
                
                return (
                  <div key={status} className="flex items-center">
                    {getStatusBadge(status)}
                    <span className="ml-1 text-xs bg-white px-1.5 py-0.5 rounded text-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="text-xs bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">VEHÍCULO</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">DETALLES</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">CLIENTE</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">UBICACIÓN</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">ESTADO</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {vehicles
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((vehicle, index) => (
                    <VehicleItem 
                      key={vehicle._id}
                      vehicle={vehicle}
                      index={index}
                      clients={clients}
                      getClientName={getClientName}
                      getLocation={getLocation}
                      formatDate={formatDate}
                      getStatusBadge={getStatusBadge}
                      getProgressBar={getProgressBar}
                      openClientModal={openClientModal}
                      openCommentsModal={openCommentsModal}
                      openPhotoModal={openPhotoModal}
                      openDriverModal={openDriverModal}
                      handleDelete={handleDelete}
                      onUpdateStatus={onUpdateStatus}
                      display="table"
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-2 space-y-2">
        {vehicles
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(vehicle => (
            <VehicleItem 
              key={vehicle._id}
              vehicle={vehicle}
              clients={clients}
              getClientName={getClientName}
              getLocation={getLocation}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              getProgressBar={getProgressBar}
              openClientModal={openClientModal}
              openCommentsModal={openCommentsModal}
              openPhotoModal={openPhotoModal}
              openDriverModal={openDriverModal}
              handleDelete={handleDelete}
              onUpdateStatus={onUpdateStatus}
              display="card"
            />
          ))}
          
        {vehicles.length === 0 && (
          <div className="py-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg my-2">
            No hay vehículos en este grupo
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {groupedVehicles.unassigned.length > 0 && (
        <VehicleGroupTable 
          vehicles={groupedVehicles.unassigned} 
          groupTitle={`Sin Conductor Asignado (${groupedVehicles.unassigned.length})`}
          className="border-l-2 border-black"
        />
      )}

      {drivers
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(driver => {
          const driverVehicles = groupedVehicles[driver._id] || [];
          if (driverVehicles.length === 0) return null;

          return (
            <VehicleGroupTable 
              key={driver._id}
              vehicles={driverVehicles} 
              groupTitle={`${driver.name} (${driverVehicles.length})`}
              className="border-l-2 border-gray-500"
            />
          );
        })}

      {Object.values(groupedVehicles).every(group => group.length === 0) && (
        <div className="text-center py-6 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">No hay vehículos registrados</p>
        </div>
      )}

      <PhotoViewModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedPhotos(null);
        }}
        photos={selectedPhotos}
      />

      <ClientEditModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setSelectedVehicle(null);
        }}
        onSubmit={handleUpdateClient}
        vehicle={selectedVehicle}
        clients={clients}
      />

      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          setSelectedVehicle(null);
        }}
        onSubmit={handleUpdateComment}
        vehicle={selectedVehicle}
      />

      <DriverSelectModal 
        isOpen={isDriverModalOpen}
        onClose={() => {
          setIsDriverModalOpen(false);
          setVehicleForDriverAssignment(null);
        }}
        drivers={drivers.filter(driver => driver.isActive)}
        onDriverSelect={handleDriverSelect}
        selectedDriverId={
          vehicleForDriverAssignment && vehicleForDriverAssignment.driverId
            ? (typeof vehicleForDriverAssignment.driverId === 'object' && vehicleForDriverAssignment.driverId !== null
                ? vehicleForDriverAssignment.driverId._id 
                : vehicleForDriverAssignment.driverId) 
            : null
        }
      />
    </div>
  );
};

VehiclesTableView.propTypes = {
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      clientId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired
        }),
        PropTypes.oneOf([null])
      ]),
      driverId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired
        }),
        PropTypes.oneOf([null])
      ]),
      brand: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      year: PropTypes.string,
      LOT: PropTypes.string,
      PIN: PropTypes.string,
      auctionHouse: PropTypes.oneOf(['Copart', 'IAA', 'Otra']),
      lotLocation: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'assigned', 'loading', 'in-transit', 'delivered']).isRequired,
      loadingPhotos: PropTypes.shape({
        frontPhoto: PropTypes.shape({
          url: PropTypes.string,
          uploadedAt: PropTypes.string
        }),
        backPhoto: PropTypes.shape({
          url: PropTypes.string,
          uploadedAt: PropTypes.string
        }),
        leftPhoto: PropTypes.shape({
          url: PropTypes.string,
          uploadedAt: PropTypes.string
        }),
        rightPhoto: PropTypes.shape({
          url: PropTypes.string,
          uploadedAt: PropTypes.string
        })
      }),
      travelComments: PropTypes.arrayOf(PropTypes.shape({
        comment: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
      }))
    })
  ).isRequired,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool.isRequired
    })
  ).isRequired,
  onAssignDriver: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onVehicleUpdate: PropTypes.func.isRequired,
  onDeleteVehicle: PropTypes.func.isRequired,
  setVehicles: PropTypes.func.isRequired,
  setNotifications: PropTypes.func.isRequired,
};

export default VehiclesTableView;