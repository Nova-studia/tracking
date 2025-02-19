/* eslint-disable react-hooks/exhaustive-deps */
import { Pencil } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ClientEditModal from './ClientEditModal';
import PhotoViewModal from './PhotoViewModal';

const VehiclesTableView = ({ 
  vehicles, 
  clients, 
  drivers, 
  onAssignDriver, 
  onUpdateStatus,
  onVehicleUpdate,
  setVehicles
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

  const getActionButton = (vehicle) => {
    const buttons = [];

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
                onUpdateStatus(vehicle._id, 'assigned');
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
        className: 'bg-orange-500 hover:bg-orange-600'
      },
      loading: {
        action: 'in-transit',
        text: 'Iniciar Viaje',
        className: 'bg-green-500 hover:bg-green-600'
      },
      'in-transit': {
        action: 'delivered',
        text: 'Entregar',
        className: 'bg-blue-500 hover:bg-blue-600'
      }
    };

    const config = buttonConfig[vehicle.status];
    if (config) {
      buttons.push(
        <button
          key="status-button"
          onClick={() => onUpdateStatus(vehicle._id, config.action)}
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

  const [comments, setComments] = useState(() => vehicles.reduce((acc, vehicle) => ({
    ...acc,
    [vehicle._id]: vehicle.comments || ''
  }), {}));

  const handleCommentChange = (vehicleId, newComment) => {
    setComments(prev => ({ ...prev, [vehicleId]: newComment }));
  };

  const handleKeyPress = async (event, vehicleId) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      const newComments = comments[vehicleId];
      try {
        const API_URL = `${process.env.REACT_APP_API_URL}/api`;
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ comments: newComments })
        });
        if (!response.ok) throw new Error('Failed to update comments');
        
        const updatedVehicle = await response.json();
        onVehicleUpdate(updatedVehicle);
      } catch (error) {
        console.error('Error updating comments:', error);
      }
    }
  };

  // Card component for mobile view
  // VehicleCard component para vista móvil
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
            <div className="text-sm text-slate-500 mt-0.5">{vehicle.LOT || '-'}</div>
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
            </div>
   
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-600">Comentario</div>
              <input
                type="text"
                value={comments[vehicle._id]}
                onChange={(e) => handleCommentChange(vehicle._id, e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, vehicle._id)}
                placeholder="Agregar comentario..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border-0 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
  
            <div className="flex justify-center gap-2 pt-2">
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
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="text-sm bg-slate-100">
            <tr className="border-b">
              <th className="px-2 py-1.5 text-left font-bold">FECHA</th>
              <th className="px-2 py-1.5 text-left font-bold">LOT</th>
              <th className="px-2 py-1.5 text-left font-bold">UBICACIÓN</th>
              <th className="px-2 py-1.5 text-left font-bold">CLIENTE</th>
              <th className="px-2 py-1.5 text-left font-bold">MARCA</th>
              <th className="px-2 py-1.5 text-left font-bold">MODELO</th>
              <th className="px-2 py-1.5 text-left font-bold">AÑO</th>
              <th className="px-2 py-1.5 text-left font-bold">STATUS</th>
              <th className="px-2 py-1.5 text-left font-bold">COMENTARIO</th>
              <th className="px-2 py-1.5 text-center font-bold">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {vehicles
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((vehicle, index) => (
                <tr 
                  key={vehicle._id} 
                  className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <td className="px-2 py-1.5">
                    <div title={new Date(vehicle.createdAt).toLocaleDateString()}>
                      {new Date(vehicle.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div title={vehicle.LOT || '-'}>
                      {vehicle.LOT || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div title={getLocation(vehicle)}>
                      {getLocation(vehicle)}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center">
                      <div title={getClientName(vehicle)}>
                        {getClientName(vehicle)}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setIsClientModalOpen(true);
                        }}
                        className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div title={vehicle.brand || '-'}>
                      {vehicle.brand || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div title={vehicle.model || '-'}>
                      {vehicle.model || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div title={vehicle.year || '-'}>
                      {vehicle.year || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    {getProgressBar(vehicle.status)}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={comments[vehicle._id]}
                      onChange={(e) => handleCommentChange(vehicle._id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, vehicle._id)}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:ring-1 focus:ring-slate-200 outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex justify-center gap-2">
                      {getActionButton(vehicle)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
        .sort((a, b) => a.createdAt - b.createdAt)
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
        })
      ]),
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
      })
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
  onVehicleUpdate: PropTypes.func.isRequired
};

export default VehiclesTableView;