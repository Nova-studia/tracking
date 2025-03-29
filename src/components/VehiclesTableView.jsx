import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Pencil, Trash2, ChevronDown, ChevronUp, Car, MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import ClientEditModal from './ClientEditModal';
import PhotoViewModal from './PhotoViewModal';
import CommentsModal from './CommentsModal';
import DriverSelectModal from './DriverSelectModal';

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
      
      const newNotification = {
        lotInfo: `${selectedVehicle.LOT || 'LOT'} - ${selectedVehicle.brand} ${selectedVehicle.model}`,
        message: newComment.length > 50 ? `${newComment.substring(0, 50)}...` : newComment,
        vehicleId: vehicleId,
        image: selectedVehicle.loadingPhotos?.frontPhoto?.url || null,
        time: new Date().toLocaleString()
      };
      
      try {
        await fetch(`${API_URL}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newNotification)
        });
      } catch (notifError) {
        console.error('Error al guardar notificación en servidor:', notifError);
      }
      
      setNotifications(prev => [...prev, newNotification]);
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

  const handleDelete = async (vehicleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) {
      try {
        await onDeleteVehicle(vehicleId);
      } catch (error) {
        alert('Error al eliminar vehículo: ' + error.message);
      }
    }
  };
  
  // Minimalist action buttons
  const getActionButton = (vehicle) => {
    const buttons = [];
    
    buttons.push(
      <button
        key="delete-button"
        onClick={() => handleDelete(vehicle._id)}
        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full"
        title="Eliminar vehículo"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  
    if (vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0) {
      buttons.push(
        <button
          key="view-photos"
          onClick={() => {
            setSelectedPhotos(vehicle.loadingPhotos);
            setIsPhotoModalOpen(true);
          }}
          className="text-xs px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          Ver Fotos
        </button>
      );
    }

    if (vehicle.status === 'delivered') {
      if (buttons.length === 0) {
        buttons.push(
          <div key="placeholder" className="w-24" />
        );
      }
      return buttons;
    }

    if (vehicle.status === 'pending' || vehicle.status === 'assigned' || vehicle.status === 'loading') {
      buttons.push(
        <button
          key="assign-driver"
          onClick={() => openDriverModal(vehicle)}
          className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
        >
          <User className="h-3 w-3" />
          <span>
            {vehicle.status === 'pending' ? 'Asignar' : 'Reasignar'} Conductor
          </span>
        </button>
      );
    }

    // Simplified button configuration
    const buttonConfig = {
      assigned: {
        action: 'loading',
        text: 'Iniciar Carga',
        className: 'bg-black text-white',
      },
      loading: {
        action: 'in-transit',
        text: 'Iniciar Viaje',
        className: 'bg-black text-white',
      },
      'in-transit': {
        action: 'delivered',
        text: 'Entregar',
        className: 'bg-black text-white',
      }
    };

    const config = buttonConfig[vehicle.status];
    if (config) {
      buttons.push(
        <button
          key="status-button"
          onClick={() => onUpdateStatus(
            vehicle._id, 
            config.action, 
            `Vehículo ${config.action === 'loading' ? 'en carga' : config.action === 'in-transit' ? 'en tránsito' : 'entregado'}`
          )}
          className={`text-xs px-3 py-1 rounded ${config.className}`}
        >
          {config.text}
        </button>
      );
    }

    return buttons;
  };

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

  // Minimalist card design
  const VehicleCard = ({ vehicle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <div className="bg-white rounded border border-gray-200 overflow-hidden mb-2">
        <div className="p-3 flex items-center justify-between">
          <div className="flex flex-col flex-1">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Car className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <span className="font-medium text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
              <div className="ml-auto">
                {getStatusBadge(vehicle.status)}
              </div>
            </div>
            <div className="flex flex-wrap items-center mt-2">
              <div className="flex items-center mr-3">
                <span className="text-xs text-gray-500">LOT: {vehicle.LOT}</span>
              </div>
              <div className="flex items-center mr-3">
                <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">{formatDate(vehicle.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500 truncate max-w-[160px]">{getLocation(vehicle)}</span>
              </div>
            </div>
          </div>
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
  
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-3 mb-4">
              {getProgressBar(vehicle.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600">{new Date(vehicle.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{getLocation(vehicle)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600">{vehicle.auctionHouse || '-'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{getClientName(vehicle)}</span>
              </div>
            </div>
  
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicle(vehicle);
                  setIsCommentsModalOpen(true);
                }}
                className="flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-100"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Comentarios</span>
              </button>
              
              {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotos(vehicle.loadingPhotos);
                    setIsPhotoModalOpen(true);
                  }}
                  className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-100"
                >
                  Ver Fotos
                </button>
              )}
              
              {getActionButton(vehicle).map((button, index) => (
                <span key={index} onClick={e => e.stopPropagation()}>
                  {button}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Minimalist table design
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
                    <tr 
                      key={vehicle._id} 
                      className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
                          <span className="text-xs text-gray-500 mt-0.5">Creado: {formatDate(vehicle.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-gray-700">LOT: {vehicle.LOT || '-'}</span>
                          <span className="text-xs text-gray-500 mt-0.5">PIN: {vehicle.PIN || '-'}</span>
                          <span className="text-xs text-gray-500 mt-0.5">Casa: {vehicle.auctionHouse || '-'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-gray-700 truncate max-w-[120px]">{getClientName(vehicle)}</span>
                              <button
                                onClick={() => {
                                  setSelectedVehicle(vehicle);
                                  setIsClientModalOpen(true);
                                }}
                                className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 truncate max-w-[160px]">{getLocation(vehicle)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col space-y-2">
                          {getStatusBadge(vehicle.status)}
                          <div className="mt-1 w-24">
                            {getProgressBar(vehicle.status)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsCommentsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            title={vehicle.comments || 'Sin comentarios'}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          
                          {getActionButton(vehicle)}
                        </div>
                      </td>
                    </tr>
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
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
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