import React, { useState } from 'react';

const DriversTab = ({ drivers, onAddDriver }) => {
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    license: '',
  });

  const handleSubmit = () => {
    if (!newDriver.name || !newDriver.phone) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    onAddDriver(newDriver);
    setNewDriver({
      name: '',
      phone: '',
      license: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Agregar Nuevo Driver</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Driver"
            value={newDriver.name}
            onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={newDriver.phone}
            onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          <input
            type="text"
            placeholder="Número de Licencia"
            value={newDriver.license}
            onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Agregar Driver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Lista de Drivers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.map(driver => (
            <div key={driver.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">{driver.name}</h3>
              <p className="text-slate-600">📞 {driver.phone}</p>
              {driver.license && (
                <p className="text-slate-600">🪪 Licencia: {driver.license}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriversTab;
