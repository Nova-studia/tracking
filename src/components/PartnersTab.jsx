import React, { useState } from 'react';
import PropTypes from 'prop-types';

const PartnersTab = ({ partners, onAddPartner, onToggleStatus, onUpdatePartner, onDeletePartner }) => {
  const [newPartner, setNewPartner] = useState({
    username: '',
    password: '',
    partnerGroup: '',
    state: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPartner.username || !newPartner.password || !newPartner.partnerGroup) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      await onAddPartner(newPartner);
      setNewPartner({
        username: '',
        password: '',
        partnerGroup: '',
        state: ''
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900 text-lg">Registrar Nuevo Socio</h2>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Usuario</label>
                <input
                  type="text"
                  value={newPartner.username}
                  onChange={(e) => setNewPartner({...newPartner, username: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  placeholder="Nombre de usuario"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  type="password"
                  value={newPartner.password}
                  onChange={(e) => setNewPartner({...newPartner, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  placeholder="Contraseña"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Grupo</label>
                <input
                  type="text"
                  value={newPartner.partnerGroup}
                  onChange={(e) => setNewPartner({...newPartner, partnerGroup: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  placeholder="Nombre del grupo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Estado</label>
                <input
                  type="text"
                  value={newPartner.state}
                  onChange={(e) => setNewPartner({...newPartner, state: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  placeholder="Estado"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Registrar Socio
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900 text-lg">Lista de Socios</h2>
        </div>
        
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Grupo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {partners.map(partner => (
                  <tr key={partner._id || partner.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{partner.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{partner.partnerGroup}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{partner.state}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {partner.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onToggleStatus(partner._id || partner.id)}
                          className={`px-3 py-1 rounded text-white text-xs ${partner.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                          {partner.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => onDeletePartner(partner._id || partner.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {partners.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">
                      No hay socios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

PartnersTab.propTypes = {
  partners: PropTypes.array.isRequired,
  onAddPartner: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onUpdatePartner: PropTypes.func.isRequired,
  onDeletePartner: PropTypes.func.isRequired
};

export default PartnersTab;