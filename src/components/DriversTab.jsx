import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Power } from 'lucide-react';

const DriversTab = ({ drivers, onAddDriver, onUpdateCredentials, onToggleStatus }) => {
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    license: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editCredentials, setEditCredentials] = useState({
    username: '',
    password: ''
  });

  const validateDriverData = () => {
    if (!newDriver.name.trim()) return 'El nombre es requerido';
    if (!newDriver.phone.trim()) return 'El teléfono es requerido';
    if (newDriver.username && newDriver.username.length < 4) return 'El username debe tener al menos 4 caracteres';
    if (newDriver.password && newDriver.password.length < 4) return 'La contraseña debe tener al menos 4 caracteres';
    return null;
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const validationError = validateDriverData();
      if (validationError) {
        setError(validationError);
        return;
      }

      const driverData = {
        ...newDriver,
        username: newDriver.username || newDriver.phone, // Si no se proporciona username, usa el teléfono
        password: newDriver.password || '1234' // Password por defecto si no se proporciona
      };

      const response = await onAddDriver(driverData);

      // Mostrar credenciales y mensaje de éxito
      setSuccess(`
        Conductor creado exitosamente!
        Username: ${response.username}
        Password inicial: ${response.tempPassword}
        Por favor, guarde estas credenciales.
      `);

      // Limpiar el formulario
      setNewDriver({
        name: '',
        phone: '',
        license: '',
        username: '',
        password: ''
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async (driverId) => {
    try {
      setError(null);
      setLoading(true);

      if (!editCredentials.username && !editCredentials.password) {
        setError('Ingrese un nuevo username o password');
        return;
      }

      await onUpdateCredentials(driverId, editCredentials);
      setEditingDriver(null);
      setEditCredentials({ username: '', password: '' });
      setSuccess('Credenciales actualizadas exitosamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensajes de error y éxito */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg whitespace-pre-line">
          {success}
        </div>
      )}

      {/* Formulario de nuevo conductor */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Agregar Nuevo Conductor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Conductor *"
            value={newDriver.name}
            onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading}
          />
          <input
            type="tel"
            placeholder="Teléfono *"
            value={newDriver.phone}
            onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Número de Licencia (opcional)"
            value={newDriver.license}
            onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Username (opcional)"
            value={newDriver.username}
            onChange={(e) => setNewDriver({...newDriver, username: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (opcional)"
              value={newDriver.password}
              onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-400"
          >
            {loading ? 'Creando...' : 'Agregar Conductor'}
          </button>
        </div>
      </div>

      {/* Lista de conductores */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Conductores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.map(driver => (
            <div key={driver._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-slate-900">{driver.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingDriver(driver._id)}
                    className="p-2 bg-slate-200 rounded-lg text-slate-700 hover:bg-slate-300"
                    title="Editar credenciales"
                  >
                    <Lock className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(driver._id)}
                    className={`p-2 rounded-lg ${driver.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    title={driver.isActive ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-slate-600">📞 {driver.phone}</p>
                {driver.license && (
                  <p className="text-slate-600">🪪 Licencia: {driver.license}</p>
                )}
                <p className="text-slate-600">👤 Usuario: {driver.username}</p>
                <p className="text-slate-600">
                  Estado: {driver.isActive ? 
                    <span className="text-green-600">Activo</span> : 
                    <span className="text-red-600">Inactivo</span>
                  }
                </p>

                {editingDriver === driver._id && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-3">Actualizar Credenciales</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nuevo username"
                        value={editCredentials.username}
                        onChange={(e) => setEditCredentials({...editCredentials, username: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={editCredentials.password}
                        onChange={(e) => setEditCredentials({...editCredentials, password: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCredentials(driver._id)}
                          className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                        >
                          Actualizar
                        </button>
                        <button
                          onClick={() => {
                            setEditingDriver(null);
                            setEditCredentials({ username: '', password: '' });
                          }}
                          className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriversTab;