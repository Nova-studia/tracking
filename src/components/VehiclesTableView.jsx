import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PhotoViewModal from './PhotoViewModal';

const VehiclesTableView = ({ vehicles, clients, drivers, onAssignDriver, onUpdateStatus }) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(null);

  // Ordenar y agrupar vehículos por conductor
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
      // Validar que vehicle.driverId no sea null antes de acceder a sus propiedades
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

  // Función para obtener la barra de progreso con el estado
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
          <span className="absolute inset-0 text-center text-xs font-bold flex items-center justify-center text-white">
            {textMap[status]}
          </span>
        </div>
      </div>
    );
  };

  // Función para obtener el botón de acción según el estado
  const getActionButton = (vehicle) => {
    const buttons = [];

    // Botón de ver fotos si existen
    if (vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0) {
      buttons.push(
        <button
          key="view-photos"
          onClick={() => {
            setSelectedPhotos(vehicle.loadingPhotos);
            setIsPhotoModalOpen(true);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-700 transition-colors transform hover:scale-105 shadow hover:shadow-md w-32"
        >
          Ver Fotos
        </button>
      );
    }

    if (vehicle.status === 'delivered') {
      if (buttons.length === 0) {
        buttons.push(
          <div key="placeholder" className="w-32" />
        );
      }
      return buttons;
    }

    // Si está pendiente, mostrar selector de conductor
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
          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm w-32 hover:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
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

    // Botones según el estado
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
          className={`px-4 py-2 rounded-lg text-white text-sm transition-all transform hover:scale-105 shadow hover:shadow-md w-32 ${config.className}`}
        >
          {config.text}
        </button>
      );
    }

    return buttons;
  };

  // Funciones auxiliares para obtener nombres
  const getClientName = (vehicle) => {
    if (!vehicle?.clientId) return '-';
    const clientId = typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId;
    return clients.find(c => c._id === clientId)?.name || '-';
  };

  const getLocation = (vehicle) => {
    if (vehicle.lotLocation) {
      return vehicle.lotLocation;
    }
    return vehicle.city && vehicle.state ? `${vehicle.city}, ${vehicle.state}` : '-';
  };

  // Componente para la tabla de vehículos por grupo
  const VehicleGroupTable = ({ vehicles, groupTitle, className }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 ${className}`}>
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{groupTitle}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs bg-slate-100">
            <tr className="border-b">
              <th className="px-4 py-3">LOT</th>
              <th className="px-4 py-3">UBICACIÓN</th>
              <th className="px-4 py-3">CLIENTE</th>
              <th className="px-4 py-3">MARCA</th>
              <th className="px-4 py-3">MODELO</th>
              <th className="px-4 py-3">AÑO</th>
              <th className="px-4 py-3 w-64">STATUS</th>
              <th className="px-1 py-1 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, index) => (
              <tr 
                key={vehicle._id} 
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-4 py-3">{vehicle.LOT || '-'}</td>
                <td className="px-4 py-3">{getLocation(vehicle)}</td>
                <td className="px-4 py-3">{getClientName(vehicle)}</td>
                <td className="px-4 py-3">{vehicle.brand || '-'}</td>
                <td className="px-4 py-3">{vehicle.model || '-'}</td>
                <td className="px-4 py-3">{vehicle.year || '-'}</td>
                <td className="px-4 py-3">
                  {getProgressBar(vehicle.status)}
                </td>
                <td className="px-1 py-1">
                  <div className="flex justify-center space-x-2">
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
    <div>
      {/* Sección de vehículos sin asignar */}
      {groupedVehicles.unassigned.length > 0 && (
        <VehicleGroupTable 
          vehicles={groupedVehicles.unassigned} 
          groupTitle={`Sin Conductor Asignado (${groupedVehicles.unassigned.length})`}
          className="border-red-200 bg-red-50"
        />
      )}

  {/* Secciones por conductor */}
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

      {/* Mensaje cuando no hay vehículos */}
      {Object.values(groupedVehicles).every(group => group.length === 0) && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-600">No hay vehículos registrados</p>
        </div>
      )}

      {/* Modal para visualizar fotos */}
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
