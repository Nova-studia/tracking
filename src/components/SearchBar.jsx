import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    dateRange: 'all'
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Buscar por LOT, marca, modelo, ciudad o estado..."
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200"
          onChange={(e) => handleFilterChange('searchText', e.target.value)}
        />
        
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200"
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in-transit">En Tránsito</option>
          <option value="delivered">Entregado</option>
        </select>

        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200"
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
        >
          <option value="all">Todas las fechas</option>
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;