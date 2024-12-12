import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DriverDashboard = ({ driverId }) => {
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrips, setCurrentTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);

  useEffect(() => {
    const fetchAssignedVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch('http://localhost:5000/api/vehicles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar vehículos');
        }

        const vehicles = await response.json();
        
        // Filtrar y categorizar vehículos
        const allAssigned = vehicles.filter(v => 
          v.driverId?._id === driverId || v.driverId === driverId
        );
        
        setAssignedVehicles(allAssigned);
        
        // Separar viajes actuales y completados
        setCurrentTrips(allAssigned.filter(v => 
          ['assigned', 'loading', 'in-transit'].includes(v.status)
        ));
        
        setCompletedTrips(allAssigned.filter(v => 
          v.status === 'delivered'
        ));

      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchAssignedVehicles();
    }
  }, [driverId]);

  const handleStatusUpdate = async (vehicleId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el estado');
      }

      const updatedVehicle = await response.json();

      // Actualizar las listas de vehículos
      setAssignedVehicles(prev => 
        prev.map(v => v._id === vehicleId ? updatedVehicle : v)
      );

      // Actualizar las listas según el nuevo estado
      if (newStatus === 'delivered') {
        setCurrentTrips(prev => prev.filter(v => v._id !== vehicleId));
        setCompletedTrips(prev => [...prev, updatedVehicle]);
      } else {
        setCurrentTrips(prev => 
          prev.map(v => v._id === vehicleId ? updatedVehicle : v)
        );
      }

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'loading': return 'bg-orange-100 text-orange-800';
      case 'in-transit': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned': return 'ASIGNADO';
      case 'loading': return 'EN CARGA';
      case 'in-transit': return 'EN TRÁNSITO';
      case 'delivered': return 'ENTREGADO';
      default: return 'DESCONOCIDO';
    }
  };

  const getActionButton = (vehicle) => {
    const buttonConfig = {
      assigned: {
        text: 'INICIAR CARGA',
        nextStatus: 'loading',
        className: 'bg-orange-600 hover:bg-orange-700'
      },
      loading: {
        text: 'INICIAR VIAJE',
        nextStatus: 'in-transit',
        className: 'bg-green-600 hover:bg-green-700'
      },
      'in-transit': {
        text: 'MARCAR ENTREGADO',
        nextStatus: 'delivered',
        className: 'bg-blue-600 hover:bg-blue-700'
      }
    };

    const config = buttonConfig[vehicle.status];
    if (!config) return null;

    return (
      <button
        onClick={() => handleStatusUpdate(vehicle._id, config.nextStatus)}
        className={`px-4 py-2 text-white rounded transition-colors ${config.className}`}
      >
        {config.text}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Conductor</h1>
        <p className="text-slate-600">
          Tienes {currentTrips.length} viajes activos y {completedTrips.length} completados
        </p>
      </div>

      {/* Viajes Activos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Viajes Activos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentTrips.map((vehicle) => (
            <div key={vehicle._id} className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-slate-900">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-slate-600">
                <p><span className="font-medium">LOT:</span> {vehicle.LOT}</p>
                <p><span className="font-medium">Ubicación:</span> {vehicle.lotLocation}</p>
                <p><span className="font-medium">Cliente:</span> {vehicle.clientId?.name}</p>
                {vehicle.year && <p><span className="font-medium">Año:</span> {vehicle.year}</p>}
              </div>
              
              <div className="flex justify-end space-x-2">
                {getActionButton(vehicle)}
              </div>
            </div>
          ))}
          
          {currentTrips.length === 0 && (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600">No tienes viajes activos en este momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Viajes Completados */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Historial de Entregas</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  LOT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {completedTrips.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{vehicle.LOT}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{vehicle.clientId?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{vehicle.lotLocation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {completedTrips.length === 0 && (
            <div className="text-center py-8 text-slate-600">
              No hay entregas completadas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DriverDashboard.propTypes = {
  driverId: PropTypes.string.isRequired
};

export default DriverDashboard;