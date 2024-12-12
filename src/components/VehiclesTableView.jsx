import React from 'react';
import PropTypes from 'prop-types';

const VehiclesTableView = ({ vehicles, clients, drivers, onAssignDriver, onUpdateStatus }) => {
  // Ordenar vehículos por prioridad de estado
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

  // Función para obtener la barra de progreso con el estado
  const getProgressBar = (status) => {
    const styles = {
      pending: 'bg-red-500',
      assigned: 'bg-yellow-500',
      loading: 'bg-orange-500',
      'in-transit': 'bg-green-500',
      delivered: 'bg-blue-500'
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
    if (vehicle.status === 'delivered') {
      return null;
    }

    // Si está pendiente, mostrar selector de conductor
    if (vehicle.status === 'pending') {
      return (
        <select
          value={vehicle.driverId || ''}
          onChange={(e) => {
            onAssignDriver(vehicle._id, e.target.value);
            if (e.target.value) {
              setTimeout(() => {
                onUpdateStatus(vehicle._id, 'assigned');
              }, 100);
            }
          }}
          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm w-full"
        >
          <option value="">Asignar Conductor</option>
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
        text: 'Marcar Entregado',
        className: 'bg-blue-500 hover:bg-blue-600'
      }
    };

    const config = buttonConfig[vehicle.status];
    if (!config) return null;

    return (
      <button
        onClick={() => onUpdateStatus(vehicle._id, config.action)}
        className={`px-4 py-2 rounded-lg text-white text-sm transition-colors ${config.className}`}
      >
        {config.text}
      </button>
    );
  };

  // Funciones auxiliares para obtener nombres
  const getClientName = (vehicle) => {
    if (!vehicle?.clientId) return '-';
    const clientId = typeof vehicle.clientId === 'object' ? vehicle.clientId._id : vehicle.clientId;
    return clients.find(c => c._id === clientId)?.name || '-';
  };

  const getDriverName = (vehicle) => {
    if (!vehicle?.driverId) return '-';
    const driverId = typeof vehicle.driverId === 'object' ? vehicle.driverId._id : vehicle.driverId;
    return drivers.find(d => d._id === driverId)?.name || '-';
  };

  const getLocation = (vehicle) => {
    if (vehicle.lotLocation) {
      return vehicle.lotLocation;
    }
    return vehicle.city && vehicle.state ? `${vehicle.city}, ${vehicle.state}` : '-';
  };

  return (
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
            <th className="px-4 py-3">CONDUCTOR</th>
            <th className="px-4 py-3 w-64">STATUS</th>
            <th className="px-4 py-3 w-32">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {sortedVehicles.map((vehicle, index) => (
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
              <td className="px-4 py-3">{getDriverName(vehicle)}</td>
              <td className="px-4 py-3">
                {getProgressBar(vehicle.status)}
              </td>
              <td className="px-4 py-3">
                {getActionButton(vehicle)}
              </td>
            </tr>
          ))}
          {sortedVehicles.length === 0 && (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                No hay vehículos registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
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