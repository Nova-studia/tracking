import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
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
  onDeleteVehicle,  // Agregar esta línea
  setVehicles 
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

    if (vehicle.status === 'pending') {
      const select = (
        <select
          key="driver-select"
          value={vehicle.driverId || ''}
          onChange={(e) => {
            onAssignDriver(vehicle._id, e.target.value);
            if (e.target.value) {
              setTimeout(() => {
                onUpdateStatus(vehicle._id, 'assigned', 'Conductor asignado al vehículo');
              }, 100);
            }
          }}
          className="px-2 py-1 rounded text-sm font-medium bg-white border border-slate-200 text-slate-800 w-24 hover:border-slate-300 focus:ring-1 focus:ring-slate-200"
        >
          <option value="">Asignar</option>
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
      return buttons;
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
  
    const getStatusBadge = (status) => {
      const styles = {
        pending: 'bg-red-500 text-white',
        assigned: 'bg-orange-500 text-white',
        loading: 'bg-blue-500 text-white',
        'in-transit': 'bg-indigo-500 text-white',
        delivered: 'bg-green-500 text-white'
      };
    
      const textMap = {
        pending: 'PENDIENTE',
        assigned: 'ASIGNADO',
        loading: 'EN CARGA',
        'in-transit': 'EN TRÁNSITO',
        delivered: 'ENTREGADO'
      };
    
      return (
        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-md ${styles[status]}`}>
          {textMap[status]}
        </span>
      );
    };
  
    return (
      <div className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden hover:bg-slate-50 transition-colors">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex flex-col items-start">
            <div className="font-semibold text-slate-800">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {vehicle.LOT || '-'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(vehicle.status)}
            <svg 
              className={`w-5 h-5 transform transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
  
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
  <div className="text-sm font-medium text-slate-600">
    {vehicle.status === 'delivered' ? 'Fecha de Entrega' : 'Fecha de Asignación'}
  </div>
  <div className="text-slate-800">
    {vehicle.status === 'delivered' ? 
      new Date(vehicle.updatedAt).toLocaleDateString() : 
      new Date(vehicle.createdAt).toLocaleDateString()
    }
  </div>
</div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-600">Cliente</div>
                <div className="flex items-center">
                  <span className="text-slate-800">{getClientName(vehicle)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setIsClientModalOpen(true);
                    }}
                    className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-600">Ubicación</div>
                <div className="text-slate-800">{getLocation(vehicle)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-600">Subasta</div>
                <div className="text-slate-800">{vehicle.auctionHouse || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-600">PIN</div>
                <div className="text-slate-800">{vehicle.PIN || '-'}</div>
              </div>
            </div>
   
            <div className="flex justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicle(vehicle);
                  setIsCommentsModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                <MessageSquare className="h-4 w-4" />
                Comentarios
              </button>
              {getActionButton(vehicle)}
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
                  <th className="px-4 py-2 text-left font-bold">FECHA</th>
                  <th className="px-4 py-2 text-left font-bold">LOT</th>
                  <th className="px-4 py-2 text-left font-bold">PIN</th>
                  <th className="px-4 py-2 text-left font-bold">SUBASTA</th>
                  <th className="px-4 py-2 text-left font-bold">UBICACIÓN</th>
                  <th className="px-4 py-2 text-left font-bold min-w-[150px]">CLIENTE</th>
                  <th className="px-4 py-2 text-left font-bold">MARCA</th>
                  <th className="px-4 py-2 text-left font-bold">MODELO</th>
                  <th className="px-4 py-2 text-left font-bold">AÑO</th>
                  <th className="px-4 py-2 text-left font-bold min-w-[120px]">STATUS</th>
                  <th className="px-4 py-2 text-center font-bold">COMENTARIOS</th>
                  <th className="px-4 py-2 text-center font-bold min-w-[180px]">ACCIONES</th>
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
                      <td className="px-4 py-2">{vehicle.LOT || '-'}</td>
                      <td className="px-4 py-2">{vehicle.PIN || '-'}</td>
                      <td className="px-4 py-2">{vehicle.auctionHouse || '-'}</td>
                      <td className="px-4 py-2">{getLocation(vehicle)}</td>
                      <td className="px-4 py-2">
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
                      <td className="px-4 py-2">{vehicle.brand || '-'}</td>
                      <td className="px-4 py-2">{vehicle.model || '-'}</td>
                      <td className="px-4 py-2">{vehicle.year || '-'}</td>
                      <td className="px-4 py-2">{getProgressBar(vehicle.status)}</td>
                      <td className="px-4 py-2">
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
      <div className="md:hidden px-4 py-2">
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
  onDeleteVehicle: PropTypes.func.isRequired,  // Nueva prop agregada
  setVehicles: PropTypes.func.isRequired
};

export default VehiclesTableView;