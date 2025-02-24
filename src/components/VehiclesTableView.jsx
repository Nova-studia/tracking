import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ClientEditModal from './ClientEditModal';
import PhotoViewModal from './PhotoViewModal';
import CommentsModal from './CommentsModal';

const VehiclesTableView = ({ 
  vehicles, 
  clients, 
  drivers, 
  onAssignDriver, 
  onUpdateStatus,
  onVehicleUpdate,
  onDeleteVehicle,  
  setVehicles,
  setNotifications  // Nueva prop
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
      
      // Agregar notificación
      setNotifications(prev => [...prev, {
        lotInfo: `${selectedVehicle.LOT || 'LOT'} - ${selectedVehicle.brand} ${selectedVehicle.model}`,
        message: newComment.length > 50 ? `${newComment.substring(0, 50)}...` : newComment,
        time: new Date().toLocaleString(),
        vehicleId: vehicleId,
        image: selectedVehicle.loadingPhotos?.frontPhoto?.url || null
      }]);
      
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
      const driverId = vehicle.driverId
        ? (typeof vehicle.driverId === 'object' ? vehicle.driverId._id : vehicle.driverId)
        : null;

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

  const getProgressBar = (status) => {
    const styles = {
      pending: 'bg-red-600',
      assigned: 'bg-orange-400',
      loading: 'bg-blue-200',
      'in-transit': 'bg-blue-600',
      delivered: 'bg-lime-400'
    };

    const textMap = {
      pending: 'PENDIENTE',
      assigned: 'ASIGNADO',
      loading: 'EN CARGA',
      'in-transit': 'EN TRÁNSITO',
      delivered: 'ENTREGADO'
    };

    return (
      <div className="w-full">
        <div className={`${styles[status]} h-6 rounded relative`}>
          <span className="absolute inset-0 text-center text-sm font-bold flex items-center justify-center text-white">
            {textMap[status]}
          </span>
        </div>
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
  
  const getActionButton = (vehicle) => {
    const buttons = [];
    
    // Agregar botón de eliminar para todos los vehículos
    buttons.push(
      <button
        key="delete-button"
        onClick={() => handleDelete(vehicle._id)}
        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
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
          className="px-2 py-1 text-sm font-medium bg-black text-white rounded hover:bg-slate-700 transition-colors w-24"
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
      const select = (
        <select
          key="driver-select"
          value={vehicle.driverId ? (typeof vehicle.driverId === 'object' ? vehicle.driverId._id : vehicle.driverId) : ''}
          onChange={(e) => {
            onAssignDriver(vehicle._id, e.target.value);
            if (e.target.value && vehicle.status === 'pending') {
              setTimeout(() => {
                onUpdateStatus(vehicle._id, 'assigned', 'Conductor asignado al vehículo');
              }, 100);
            }
          }}
          className="px-2 py-1 rounded text-sm font-medium bg-white border border-slate-200 text-slate-800 w-24 hover:border-slate-300 focus:ring-1 focus:ring-slate-200"
        >
          <option value="">
            {vehicle.status === 'pending' ? 'Asignar' : 'Reasignar'}
          </option>
          {drivers
            .filter(driver => driver.isActive)
            .map(driver => (
              <option key={driver._id} value={driver._id}>
                {driver.name}
              </option>
            ))
          }
        </select>
      );
      buttons.push(select);
    }

    const buttonConfig = {
      assigned: {
        action: 'loading',
        text: 'Iniciar Carga',
        className: 'bg-orange-500 hover:bg-orange-600',
        comment: 'Iniciando carga del vehículo'
      },
      loading: {
        action: 'in-transit',
        text: 'Iniciar Viaje',
        className: 'bg-green-500 hover:bg-green-600',
        comment: 'Iniciando viaje del vehículo'
      },
      'in-transit': {
        action: 'delivered',
        text: 'Entregar',
        className: 'bg-blue-500 hover:bg-blue-600',
        comment: 'Vehículo entregado al destino'
      }
    };

    const config = buttonConfig[vehicle.status];
    if (config) {
      buttons.push(
        <button
          key="status-button"
          onClick={() => onUpdateStatus(vehicle._id, config.action, config.comment)}
          className={`px-2 py-1 rounded text-white text-sm font-medium transition-colors w-24 ${config.className}`}
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

  const VehicleCard = ({ vehicle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending':
          return 'bg-red-500';
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
        case 'pending':
          return 'PENDIENTE';
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
        <div 
          className="p-3 flex items-center justify-between cursor-pointer space-x-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
          <div className="flex flex-col">
  <span className="font-medium text-slate-900">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
  <span className="text-sm text-slate-500">LOT: {vehicle.LOT}</span>
  <span className="text-sm text-slate-500">{new Date(vehicle.createdAt).toLocaleDateString()}</span>
  <span className="text-sm text-slate-500">{getLocation(vehicle)}</span>
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
  
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="text-sm text-slate-600 space-y-2 mt-4 mb-4">
              <p><span className="font-medium">Fecha de asignación:</span> {new Date(vehicle.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Subasta:</span> {vehicle.auctionHouse || '-'}</p>
              <p><span className="font-medium">PIN:</span> {vehicle.PIN || '-'}</p>
              <p><span className="font-medium">Cliente:</span> {getClientName(vehicle)}</p>
            </div>
  
            <div className="flex flex-col gap-2">
              {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotos(vehicle.loadingPhotos);
                    setIsPhotoModalOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
                >
                  Ver Fotos
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicle(vehicle);
                  setIsCommentsModalOpen(true);
                }}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Comentarios
              </button>
              <div className="flex justify-center gap-2 mt-2">
  {getActionButton(vehicle)}
</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const VehicleGroupTable = ({ vehicles, groupTitle, className }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4 ${className}`}>
      <div className="border-b border-slate-200">
        <div className="w-full bg-slate-50 px-4 py-2 flex items-center">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-800 truncate" title={groupTitle}>
              {groupTitle}
            </h3>
          </div>
        </div>
      </div>
  
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="text-sm bg-slate-100">
                <tr className="border-b whitespace-nowrap">
                  <th className="px-2 py-2 text-left font-bold">FECHA</th>
                  <th className="px-2 py-2 text-left font-bold">LOT</th>
                  <th className="px-2 py-2 text-left font-bold">PIN</th>
                  <th className="px-2 py-2 text-left font-bold">SUBASTA</th>
                  <th className="px-2 py-2 text-left font-bold">UBICACIÓN</th>
                  <th className="px-2 py-2 text-left font-bold min-w-[150px]">CLIENTE</th>
                  <th className="px-2 py-2 text-left font-bold">MARCA</th>
                  <th className="px-2 py-2 text-left font-bold">MODELO</th>
                  <th className="px-2 py-2 text-left font-bold">AÑO</th>
                  <th className="px-2 py-2 text-left font-bold min-w-[120px]">STATUS</th>
                  <th className="px-2 py-2 text-center font-bold">COMENTARIOS</th>
                  <th className="px-2 py-2 text-center font-bold min-w-[180px]">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {vehicles
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((vehicle, index) => (
                    <tr 
                      key={vehicle._id} 
                      className={`border-b whitespace-nowrap ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <td className="px-4 py-2">
                        {vehicle.status === 'delivered' ? 
                          `Entregado: ${new Date(vehicle.updatedAt).toLocaleDateString()}` : 
                          new Date(vehicle.createdAt).toLocaleDateString()
                        }
                      </td>
                      <td className="px-2 py-2">{vehicle.LOT || '-'}</td>
                      <td className="px-2 py-2">{vehicle.PIN || '-'}</td>
                      <td className="px-2 py-2">{vehicle.auctionHouse || '-'}</td>
                      <td className="px-2 py-2">{getLocation(vehicle)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center">
                          <span className="truncate">{getClientName(vehicle)}</span>
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsClientModalOpen(true);
                            }}
                            className="ml-2 p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2">{vehicle.brand || '-'}</td>
                      <td className="px-2 py-2">{vehicle.model || '-'}</td>
                      <td className="px-2 py-2">{vehicle.year || '-'}</td>
                      <td className="px-2 py-2">{getProgressBar(vehicle.status)}</td>
                      <td className="px-2 py-2">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsCommentsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                            title={vehicle.comments || 'Sin comentarios'}
                          >
                            <MessageSquare className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-2">
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
      <div className="md:hidden">
        {vehicles
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(vehicle => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {groupedVehicles.unassigned.length > 0 && (
        <VehicleGroupTable 
          vehicles={groupedVehicles.unassigned} 
          groupTitle={`Sin Conductor Asignado (${groupedVehicles.unassigned.length})`}
          className="border-red-200"
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
            />
          );
        })}

      {Object.values(groupedVehicles).every(group => group.length === 0) && (
        <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
          <p className="text-slate-600">No hay vehículos registrados</p>
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