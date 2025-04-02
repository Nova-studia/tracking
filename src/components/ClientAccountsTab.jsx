import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ClientAccountsTab = ({ clients, onAddClientAccount, onToggleClientAccountStatus }) => {
  const [clientAccounts, setClientAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAccount, setNewAccount] = useState({
    clientId: '',
    username: '',
    password: ''
  });
  const [availableClients, setAvailableClients] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Cargar cuentas de clientes existentes
    const fetchClientAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/with-account`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar cuentas de clientes');
        }

        const data = await response.json();
        setClientAccounts(data);
        
        // Filtrar clientes sin cuenta para la lista desplegable
        const clientsWithoutAccount = clients.filter(client => 
          !data.some(account => account._id === client._id)
        );
        setAvailableClients(clientsWithoutAccount);
      } catch (error) {
        console.error('Error fetching client accounts:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientAccounts();
  }, [clients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newAccount.clientId || !newAccount.username || !newAccount.password) {
      setError('Todos los campos son requeridos');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      // Obtener información del cliente seleccionado
      const selectedClient = clients.find(c => c._id === newAccount.clientId);
      if (!selectedClient) {
        throw new Error('Cliente no encontrado');
      }
      
      const accountData = {
        name: selectedClient.name,
        phoneNumber: selectedClient.phoneNumber,
        username: newAccount.username,
        password: newAccount.password
      };
      
      const createdAccount = await onAddClientAccount(accountData);
      
      // Actualizar las listas
      setClientAccounts(prev => [...prev, createdAccount]);
      setAvailableClients(prev => prev.filter(c => c._id !== newAccount.clientId));
      
      // Limpiar el formulario
      setNewAccount({
        clientId: '',
        username: '',
        password: ''
      });
      
      setSuccess(`Cuenta creada exitosamente para ${selectedClient.name}`);
    } catch (error) {
      console.error('Error creating client account:', error);
      setError(error.message);
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      setError(null);
      
      const updatedAccount = await onToggleClientAccountStatus(clientId);
      
      // Actualizar el estado local
      setClientAccounts(prev => 
        prev.map(account => 
          account._id === clientId ? 
            { ...account, userId: { ...account.userId, isActive: !account.userId.isActive } } : 
            account
        )
      );
      
      setSuccess(`Estado de cuenta actualizado para ${updatedAccount.name}`);
    } catch (error) {
      console.error('Error toggling client account status:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      
      {/* Formulario para crear cuenta de cliente */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Crear Portal para Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Cliente</label>
              <select
                name="clientId"
                value={newAccount.clientId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Seleccione un cliente</option>
                {availableClients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Nombre de Usuario</label>
              <input
                type="text"
                name="username"
                value={newAccount.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Ej: fredylongoria"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                type="password"
                name="password"
                value={newAccount.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Contraseña"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Crear Cuenta de Acceso
            </button>
          </div>
        </form>
      </div>
      
      {/* Lista de cuentas de cliente */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-6 text-slate-900">Clientes con Acceso al Portal</h2>
        
        {clientAccounts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <p className="text-slate-500">No hay cuentas de cliente creadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientAccounts.map(account => (
              <div key={account._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{account.name}</h3>
                    <p className="text-slate-600 text-sm">Usuario: {account.userId?.username}</p>
                    <p className="text-slate-600 text-sm">Teléfono: {account.phoneNumber}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.userId?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {account.userId?.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleToggleStatus(account._id)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      account.userId?.isActive ? 
                        'bg-red-50 text-red-700 hover:bg-red-100' : 
                        'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {account.userId?.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ClientAccountsTab.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      phoneNumber: PropTypes.string.isRequired
    })
  ).isRequired,
  onAddClientAccount: PropTypes.func.isRequired,
  onToggleClientAccountStatus: PropTypes.func.isRequired
};

export default ClientAccountsTab;