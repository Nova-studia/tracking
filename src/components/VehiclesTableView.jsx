// VehiclesTableView.jsx
import React from 'react';
import PropTypes from 'prop-types';

const VehiclesTableView = ({ vehicles, clients, drivers, onAssignDriver, onUpdateStatus }) => {
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-transit': 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      pending: '🟡 PENDIENTE',
      'in-transit': '🔵 EN TRÁNSITO',
      delivered: '🟢 ENTREGADO',
      cancelled: '🔴 CANCELADO'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs bg-slate-100">
          <tr className="border-b">
            <th className="px-4 py-3">LOT</th>
            <th className="px-4 py-3">SUBASTA</th>
            <th className="px-4 py-3">CLIENTE</th>
            <th className="px-4 py-3">MARCA</th>
            <th className="px-4 py-3">MODELO</th>
            <th className="px-4 py-3">AÑO</th>
            <th className="px-4 py-3">CONDUCTOR</th>
            <th className="px-4 py-3">STATUS</th>
            <th className="px-4 py-3">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle, index) => (
            <tr 
              key={vehicle._id} 
              className={`border-b hover:bg-slate-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <td className="px-4 py-3">{vehicle.LOT}</td>
              <td className="px-4 py-3">{vehicle.lotLocation}</td>
              <td className="px-4 py-3">
                {clients.find(c => c._id === vehicle.clientId?._id || vehicle.clientId)?.name}
              </td>
              <td className="px-4 py-3">{vehicle.brand}</td>
              <td className="px-4 py-3">{vehicle.model}</td>
              <td className="px-4 py-3">{vehicle.year}</td>
              <td className="px-4 py-3">
                {vehicle.status === 'pending' ? (
                  <select
                    value={vehicle.driverId?._id || vehicle.driverId || ''}
                    onChange={(e) => onAssignDriver(vehicle._id, e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  >
                    <option value="">Sin asignar</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  drivers.find(d => d._id === (vehicle.driverId?._id || vehicle.driverId))?.name || '- Sin asignar -'
                )}
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(vehicle.status)}
              </td>
              <td className="px-4 py-3">
                {vehicle.status === 'pending' && vehicle.driverId && (
                  <button
                    onClick={() => onUpdateStatus(vehicle._id, 'in-transit')}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Iniciar Tránsito
                  </button>
                )}
                {vehicle.status === 'in-transit' && (
                  <button
                    onClick={() => onUpdateStatus(vehicle._id, 'delivered')}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Entregar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

VehiclesTableView.propTypes = {
  vehicles: PropTypes.array.isRequired,
  clients: PropTypes.array.isRequired,
  drivers: PropTypes.array.isRequired,
  onAssignDriver: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired
};

export default VehiclesTableView;