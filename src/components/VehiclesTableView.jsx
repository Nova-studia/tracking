import React from 'react';
import PropTypes from 'prop-types';

const VehiclesTableView = ({ vehicles, clients, drivers, onAssignDriver, onUpdateStatus }) => {
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const priority = { pending: 0, 'in-transit': 1, delivered: 2, cancelled: 3 };
    return priority[a.status] - priority[b.status];
  });

  const getProgressBar = (status) => {
    const colorMap = {
      'pending': 'bg-red-500',
      'in-transit': 'bg-green-500',
      'delivered': 'bg-blue-500',
      'cancelled': 'bg-gray-500'
    };

    const textMap = {
      'pending': 'PENDIENTE',
      'in-transit': 'EN TRÁNSITO',
      'delivered': 'ENTREGADO',
      'cancelled': 'CANCELADO'
    };

    return (
      <div className="w-full">
        <div className={`${colorMap[status]} h-6 rounded relative`}>
          <span className="absolute inset-0 text-center text-xs font-bold flex items-center justify-center text-white">
            {textMap[status]}
          </span>
        </div>
      </div>
    );
  };

  const getActionButton = (vehicle) => {
    if (vehicle.status === 'pending' && vehicle.driverId) {
      return (
        <button
          onClick={() => onUpdateStatus(vehicle._id, 'in-transit')}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-150 text-xs"
        >
          Iniciar Tránsito
        </button>
      );
    }
    if (vehicle.status === 'in-transit') {
      return (
        <button
          onClick={() => onUpdateStatus(vehicle._id, 'delivered')}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-150 text-xs"
        >
          Entregar
        </button>
      );
    }
    return null;
  };

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

  const getDriverId = (vehicle) => {
    if (!vehicle?.driverId) return '';
    return typeof vehicle.driverId === 'object' ? vehicle.driverId._id : vehicle.driverId;
  };

  const getLocation = (vehicle, type) => {
    if (vehicle.lotLocation) {
      const [city, state] = vehicle.lotLocation.split(',').map(s => s.trim());
      return type === 'city' ? city : state;
    }
    return type === 'city' ? (vehicle.city || '-') : (vehicle.state || '-');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs bg-slate-100">
          <tr className="border-b">
            <th className="px-4 py-3">LOT</th>
            <th className="px-4 py-3">CIUDAD</th>
            <th className="px-4 py-3">ESTADO</th>
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
              <td className="px-4 py-3">{getLocation(vehicle, 'city')}</td>
              <td className="px-4 py-3">{getLocation(vehicle, 'state')}</td>
              <td className="px-4 py-3">{getClientName(vehicle)}</td>
              <td className="px-4 py-3">{vehicle.brand || '-'}</td>
              <td className="px-4 py-3">{vehicle.model || '-'}</td>
              <td className="px-4 py-3">{vehicle.year || '-'}</td>
              <td className="px-4 py-3">
                {vehicle.status === 'pending' ? (
                  <select
                    value={getDriverId(vehicle)}
                    onChange={(e) => onAssignDriver(vehicle._id, e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-slate-200"
                  >
                    <option value="">Sin asignar</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  getDriverName(vehicle)
                )}
              </td>
              <td className="px-4 py-3">
                {getProgressBar(vehicle.status)}
              </td>
              <td className="px-4 py-3 text-right">
                {getActionButton(vehicle)}
              </td>
            </tr>
          ))}
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
      brand: PropTypes.string,
      model: PropTypes.string,
      year: PropTypes.string,
      LOT: PropTypes.string,
      lotLocation: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'in-transit', 'delivered', 'cancelled']).isRequired,
    })
  ).isRequired,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAssignDriver: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired
};

export default VehiclesTableView;