import React, { useState, useEffect } from 'react';
import ClientesTab from './ClientesTab';
import DriversTab from './DriversTab';
import VehiculosTab from './VehiculosTab';

const API_URL = 'http://localhost:5000/api';

const TransportesAdmin = () => {
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchClients(),
          fetchDrivers(),
          fetchVehicles()
        ]);
      } catch (err) {
        setError('Error al cargar los datos iniciales');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Funciones para obtener datos
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`);
      if (!response.ok) throw new Error('Error al obtener clientes');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/drivers`);
      if (!response.ok) throw new Error('Error al obtener conductores');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicles`);
      if (!response.ok) throw new Error('Error al obtener vehículos');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  };

  // Funciones para agregar nuevos registros
  const handleAddClient = async (newClient) => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) throw new Error('Error al crear cliente');
      
      const data = await response.json();
      setClients(prevClients => [...prevClients, data]);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const handleAddDriver = async (newDriver) => {
    try {
      const response = await fetch(`${API_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDriver),
      });

      if (!response.ok) throw new Error('Error al crear conductor');
      
      const data = await response.json();
      setDrivers(prevDrivers => [...prevDrivers, data]);
      return data;
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  };

  const handleAddVehicle = async (newVehicle) => {
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVehicle),
      });

      if (!response.ok) throw new Error('Error al crear vehículo');
      
      const data = await response.json();
      setVehicles(prevVehicles => [...prevVehicles, data]);
      return data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  // Función para actualizar el estado de un vehículo
  const handleUpdateVehicleStatus = async (vehicleId, status) => {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Error al actualizar estado del vehículo');
      
      const updatedVehicle = await response.json();
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle._id === vehicleId ? updatedVehicle : vehicle
        )
      );
      return updatedVehicle;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  };

  // Función para asignar conductor a un vehículo
  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/driver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) throw new Error('Error al asignar conductor');
      
      const updatedVehicle = await response.json();
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle._id === vehicleId ? updatedVehicle : vehicle
        )
      );
      return updatedVehicle;
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
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
          <p className="text-xl font-semibold">{error}</p>
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Sistema de Transportes</h1>
          <div className="flex space-x-4 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all ${
                activeTab === 'clients' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all ${
                activeTab === 'drivers' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Conductores
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all ${
                activeTab === 'vehicles' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Vehículos
            </button>
          </div>
        </header>

        {activeTab === 'clients' && (
          <ClientesTab 
            clients={clients} 
            onAddClient={handleAddClient} 
          />
        )}

        {activeTab === 'drivers' && (
          <DriversTab 
            drivers={drivers} 
            onAddDriver={handleAddDriver} 
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiculosTab 
            vehicles={vehicles}
            clients={clients}
            drivers={drivers} 
            onAddVehicle={handleAddVehicle}
            onUpdateStatus={handleUpdateVehicleStatus}
            onAssignDriver={handleAssignDriver}
          />
        )}
      </div>
    </div>
  );
};

export default TransportesAdmin;