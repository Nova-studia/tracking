import React, { useState } from 'react';
import { Eye, EyeOff, Edit2, Lock, Power } from 'lucide-react';

const DriversTab = ({ drivers, onAddDriver, onUpdateCredentials, onToggleStatus }) => {
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    license: '',
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [lastCreatedDriver, setLastCreatedDriver] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editCredentials, setEditCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async () => {
    if (!newDriver.name || !newDriver.phone) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const response = await onAddDriver(newDriver);
      setLastCreatedDriver(response);
      setShowPassword(true);
      setNewDriver({
        name: '',
        phone: '',
        license: '',
        username: '',
        password: ''
      });
    } catch (error) {
      alert('Error al crear conductor: ' + error.message);
    }
  };

  const handleUpdateCredentials = async (driverId) => {
    try {
      if (!editCredentials.username && !editCredentials.password) {
        alert('Debe proporcionar un nuevo username o password');
        return;
      }

      await onUpdateCredentials(driverId, editCredentials);
      setEditingDriver(null);
      setEditCredentials({ username: '', password: '' });
    } catch (error) {
      alert('Error al actualizar credenciales: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Agregar Nuevo Conductor</h2>
        
        {lastCreatedDriver && showPassword && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <strong>¡Conductor creado exitosamente!</strong>
            </p>
            <p className="text-green-700">
              Username: {lastCreatedDriver.username}<br/>
              Password: {lastCreatedDriver.tempPassword}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Guarde estas credenciales. No se mostrarán nuevamente.
            </p>
            <button
              onClick={() => setShowPassword(false)}
              className="mt-2 text-green-700 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Conductor *"
            value={newDriver.name}
            onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <input
            type="tel"
            placeholder="Teléfono *"
            value={newDriver.phone}
            onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <input
            type="text"
            placeholder="Número de Licencia"
            value={newDriver.license}
            onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <input
            type="text"
            placeholder="Username (opcional)"
            value={newDriver.username}
            onChange={(e) => setNewDriver({...newDriver, username: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (opcional)"
              value={newDriver.password}
              onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Agregar Conductor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Conductores</h2>
        <div className="space-y-4">
          {drivers.map(driver => (
            <div key={driver._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-slate-900">{driver.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStatus(driver._id)}
                    className={`p-2 rounded-lg ${driver.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    title={driver.isActive ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={18} />
                  </button>
                  <button
                    onClick={() => setEditingDriver(driver._id)}
                    className="p-2 bg-slate-200 rounded-lg text-slate-700"
                    title="Editar credenciales"
                  >
                    <Lock size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">📞 {driver.phone}</p>
                {driver.license && (
                  <p className="text-slate-600">🪪 Licencia: {driver.license}</p>
                )}
                <p className="text-slate-600">👤 Usuario: {driver.username}</p>
              </div>

              {editingDriver === driver._id && (
                <div className="mt-4 space-y-4 p-4 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900">Actualizar Credenciales</h4>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriversTab;