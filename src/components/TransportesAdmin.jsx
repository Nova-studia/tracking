import React, { useEffect, useState } from 'react';
import ClientesTab from './ClientesTab';
import DriversTab from './DriversTab';
import VehiculosTab from './VehiculosTab';
import PartnersTab from './PartnersTab';
import ClientAccountsTab from './ClientAccountsTab'; // Importamos la nueva pestaña

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const TransportesAdmin = ({ setNotifications }) => {
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : {};
  });
  const [partners, setPartners] = useState([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener clientes');
        }
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
    };
  
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/drivers`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener conductores');
        }
        const data = await response.json();
        console.log('Conductores recibidos:', data.length);
        setDrivers(data);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }
    };
  
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_URL}/vehicles`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener vehículos');
        }
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
    };
  
    const fetchPartners = async () => {
      // Solo cargar socios si el usuario es admin principal
      if (!userInfo.isMainAdmin) return [];
      
      try {
        const response = await fetch(`${API_URL}/partners`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener socios');
        }
        const data = await response.json();
        setPartners(data);
        return data;
      } catch (error) {
        console.error('Error fetching partners:', error);
        return [];
      }
    };
  
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchClients(),
          fetchDrivers(),
          fetchVehicles(),
          fetchPartners()
        ]);
      } catch (err) {
        setError('Error al cargar los datos iniciales: ' + err.message);
        console.error('Error completo:', err);
      } finally {
        setLoading(false);
      }
    };
  
    loadInitialData();
  }, [userInfo.isMainAdmin]);

  const handleAddClient = async (newClient) => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear cliente');
      }
      
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
        headers: getAuthHeaders(),
        body: JSON.stringify(newDriver),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear conductor');
      }
      
      const data = await response.json();
      setDrivers(prevDrivers => [...prevDrivers, data]);
      return data;
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  };

  const handleUpdateCredentials = async (driverId, credentials) => {
    try {
      const response = await fetch(`${API_URL}/drivers/${driverId}/credentials`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar credenciales');
      }
      
      const updatedDriver = await response.json();
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver._id === driverId ? updatedDriver : driver
        )
      );
      return updatedDriver;
    } catch (error) {
      console.error('Error updating credentials:', error);
      throw error;
    }
  };

  const handleToggleStatus = async (driverId) => {
    try {
      const response = await fetch(`${API_URL}/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar estado');
      }
      
      const updatedDriver = await response.json();
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver._id === driverId ? updatedDriver : driver
        )
      );
      return updatedDriver;
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    }
  };

  const handleAddVehicle = async (newVehicle) => {
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVehicle),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear vehículo');
      }
      
      const data = await response.json();
      setVehicles(prevVehicles => [...prevVehicles, data]);
      return data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (vehicleId, status, comment) => {
    try {
      console.log('Actualizando estado:', vehicleId, status);
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          status,
          comment: comment || `Estado actualizado a ${status}`  // Comentario por defecto si no se proporciona
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar estado');
      }
      
      const updatedVehicle = await response.json();
      console.log('Vehículo actualizado:', updatedVehicle);
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle._id === vehicleId ? updatedVehicle : vehicle
        )
      );
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar vehículo');
      }
  
      setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle._id !== vehicleId));
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const handleAddPartner = async (newPartner) => {
    try {
      const response = await fetch(`${API_URL}/partners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newPartner),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear socio');
      }
      
      const data = await response.json();
      setPartners(prevPartners => [...prevPartners, data]);
      return data;
    } catch (error) {
      console.error('Error adding partner:', error);
      throw error;
    }
  };
  
  const handleTogglePartnerStatus = async (partnerId) => {
    try {
      const response = await fetch(`${API_URL}/partners/${partnerId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar estado del socio');
      }
      
      const updatedPartner = await response.json();
      setPartners(prevPartners =>
        prevPartners.map(partner =>
          partner._id === partnerId ? updatedPartner : partner
        )
      );
      return updatedPartner;
    } catch (error) {
      console.error('Error toggling partner status:', error);
      throw error;
    }
  };
  
  const handleUpdatePartner = async (partnerId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/partners/${partnerId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar socio');
      }
      
      const updatedPartner = await response.json();
      setPartners(prevPartners =>
        prevPartners.map(partner =>
          partner._id === partnerId ? updatedPartner : partner
        )
      );
      return updatedPartner;
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  };
  
  const handleDeletePartner = async (partnerId) => {
    try {
      const response = await fetch(`${API_URL}/partners/${partnerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar socio');
      }
  
      setPartners(prevPartners => prevPartners.filter(partner => partner._id !== partnerId));
      return true;
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      // Primero asignamos el conductor
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/driver`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ driverId: driverId === '' ? null : driverId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al asignar conductor');
      }
      
      const updatedVehicle = await response.json();
      setVehicles(prev => prev.map(v => v._id === vehicleId ? updatedVehicle : v));
  
      // Solo si se asignó un conductor (driverId no está vacío) y el vehículo estaba en estado 'pending',
      // actualizamos el estado a 'assigned'
      const currentVehicle = vehicles.find(v => v._id === vehicleId);
      if (driverId && currentVehicle && currentVehicle.status === 'pending') {
        await handleUpdateStatus(vehicleId, 'assigned', 'Conductor asignado al vehículo');
      }
      
      return updatedVehicle;
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al asignar conductor: ' + error.message);
    }
  };

  // Nuevos métodos para manejar cuentas de clientes
  const handleAddClientAccount = async (accountData) => {
    try {
      const response = await fetch(`${API_URL}/clients/with-account`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear cuenta de cliente');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding client account:', error);
      throw error;
    }
  };

  const handleToggleClientAccountStatus = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/account-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar estado de cuenta');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling client account status:', error);
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
      <div className="container mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Sistema de Transportes</h1>
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all whitespace-nowrap ${
                activeTab === 'vehicles' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Vehículos
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all whitespace-nowrap ${
                activeTab === 'clients' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('clientAccounts')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all whitespace-nowrap ${
                activeTab === 'clientAccounts' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Portal Clientes
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all whitespace-nowrap ${
                activeTab === 'drivers' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Conductores
            </button>
            {userInfo.isMainAdmin && (
              <button
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-2.5 rounded-md flex items-center flex-1 justify-center transition-all whitespace-nowrap ${
                  activeTab === 'partners' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Socios
              </button>
            )}
          </div>
        </header>

        {activeTab === 'clients' && (
          <ClientesTab 
            clients={clients} 
            onAddClient={handleAddClient} 
          />
        )}

        {activeTab === 'clientAccounts' && (
          <ClientAccountsTab 
            clients={clients}
            onAddClientAccount={handleAddClientAccount}
            onToggleClientAccountStatus={handleToggleClientAccountStatus}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversTab 
            drivers={drivers} 
            onAddDriver={handleAddDriver}
            onUpdateCredentials={handleUpdateCredentials}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiculosTab 
            vehicles={vehicles}
            setVehicles={setVehicles}
            clients={clients}
            drivers={drivers} 
            onAddVehicle={handleAddVehicle}
            onUpdateStatus={handleUpdateStatus}
            onAssignDriver={handleAssignDriver}
            onDeleteVehicle={handleDeleteVehicle}
            setNotifications={setNotifications}
            userInfo={userInfo}
          />
        )}

        {activeTab === 'partners' && userInfo.isMainAdmin && (
          <PartnersTab 
            partners={partners}
            onAddPartner={handleAddPartner}
            onToggleStatus={handleTogglePartnerStatus}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
          />
        )}
      </div>
    </div>
  );
};

export default TransportesAdmin;