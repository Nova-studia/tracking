import React, { useState, useEffect } from 'react';

const DriverDashboard = ({ driverId }) => {
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedVehicles = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/vehicles`);
        const vehicles = await response.json();
        const filtered = vehicles.filter(v => v.driverId?.name === driverId);
        setAssignedVehicles(filtered);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedVehicles();
  }, [driverId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Panel de Conductor</h1>
      
      <div className="grid gap-6">
        {assignedVehicles.map((vehicle) => (
          <div key={vehicle._id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </h2>
            <div className="space-y-2">
              <p><strong>LOT:</strong> {vehicle.LOT}</p>
              <p><strong>Ubicación:</strong> {vehicle.lotLocation}</p>
              <p><strong>Estado:</strong> {vehicle.status}</p>
              <p><strong>Cliente:</strong> {vehicle.clientId?.name}</p>
            </div>
          </div>
        ))}
        
        {assignedVehicles.length === 0 && (
          <div className="text-center text-slate-600">
            No tienes vehículos asignados actualmente.
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;