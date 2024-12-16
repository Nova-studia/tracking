import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PhotoViewModal from './PhotoViewModal';

const VehiclesTableView = ({ vehicles, clients, drivers, onAssignDriver, onUpdateStatus }) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);

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
      pending: 'bg-red-500',
      assigned: 'bg-yellow-300',
      loading: 'bg-yellow-400',
      'in-transit': 'bg-blue-500',
      delivered: 'bg-green-500'
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

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{width: '80px'}} /> {/* LOT */}
            <col style={{width: '120px'}} /> {/* UBICACIÓN */}
            <col style={{width: '120px'}} /> {/* CLIENTE */}
            <col style={{width: '90px'}} /> {/* MARCA */}
            <col style={{width: '90px'}} /> {/* MODELO */}
            <col style={{width: '60px'}} />  {/* AÑO */}
            <col style={{width: '200px'}} /> {/* STATUS */}
            <col style={{width: '140px'}} /> {/* ACCIONES */}
          </colgroup>
          <thead className="text-sm bg-slate-100">
            <tr className="border-b">
              <th className="px-2 py-1.5 text-left font-bold">LOT</th>
              <th className="px-2 py-1.5 text-left font-bold">UBICACIÓN</th>
              <th className="px-2 py-1.5 text-left font-bold">CLIENTE</th>
              <th className="px-2 py-1.5 text-left font-bold">MARCA</th>
              <th className="px-2 py-1.5 text-left font-bold">MODELO</th>
              <th className="px-2 py-1.5 text-left font-bold">AÑO</th>
              <th className="px-2 py-1.5 text-left font-bold">STATUS</th>
              <th className="px-2 py-1.5 text-center font-bold">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {vehicles.map((vehicle, index) => (
              <tr 
                key={vehicle._id} 
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-2 py-1.5">
                  <div className="truncate" title={vehicle.LOT || '-'}>
                    {vehicle.LOT || '-'}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="truncate" title={getLocation(vehicle)}>
                    {getLocation(vehicle)}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="truncate" title={getClientName(vehicle)}>
                    {getClientName(vehicle)}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="truncate" title={vehicle.brand || '-'}>
                    {vehicle.brand || '-'}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="truncate" title={vehicle.model || '-'}>
                    {vehicle.model || '-'}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="truncate" title={vehicle.year || '-'}>
                    {vehicle.year || '-'}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  {getProgressBar(vehicle.status)}
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

      {drivers.map(driver => {
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
      ]).isRequired,
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
  onUpdateStatus: PropTypes.func.isRequired
};

export default VehiclesTableView;