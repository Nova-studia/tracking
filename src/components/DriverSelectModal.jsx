import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Search, User, Phone, CheckCircle } from 'lucide-react';

const DriverSelectModal = ({ isOpen, onClose, drivers = [], onDriverSelect, selectedDriverId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usar useMemo para filtrar conductores solo cuando cambie la búsqueda o la lista
  const filteredDrivers = useMemo(() => {
    if (searchTerm.trim() === '') return drivers;
    
    return drivers.filter(driver => 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, drivers]);

  // Limpiar la búsqueda al cerrar el modal
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div 
        className="bg-white w-full max-w-md rounded-2xl flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-slate-100 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seleccionar Conductor</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-all duration-150"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar conductor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150"
            />
          </div>
        </div>
        
        {/* Drivers List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <User className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No se encontraron conductores</p>
              <p className="text-xs text-slate-400 mt-1">Intenta con otra búsqueda</p>
            </div>
          ) : (
            <div className="grid gap-2 py-2">
              {filteredDrivers.map(driver => (
                <button
                  key={driver._id}
                  onClick={() => {
                    onDriverSelect(driver._id);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center rounded-xl hover:bg-slate-50 transition-all duration-150 ${
                    selectedDriverId === driver._id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                  }`}
                >
                  <div className="h-11 w-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm mr-3">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-slate-900">{driver.name}</div>
                    {driver.phone && (
                      <div className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Phone className="h-3 w-3 mr-1" />
                        {driver.phone}
                      </div>
                    )}
                  </div>
                  {selectedDriverId === driver._id && (
                    <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DriverSelectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      phone: PropTypes.string,
      isActive: PropTypes.bool
    })
  ).isRequired,
  onDriverSelect: PropTypes.func.isRequired,
  selectedDriverId: PropTypes.string
};

export default DriverSelectModal;