'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Lottie from 'lottie-react';
import redCarAnimation from '../../../public/Red Car.json';
import greenTruckAnimation from '../../../public/Green Trucks.json';

interface Contract {
  id: number;
  phone_number: string;
  lot_number: string;
  full_name: string;
  address: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<{
    id: number;
    lotNumber: string;
    fullName: string;
    timestamp: string;
    signatureData: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContracts, setTotalContracts] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<{
    contractId: string;
    lotNumber: string;
    fullName: string;
  } | null>(null);
  const recordsPerPage = 20;

  // Refs to keep current values for SSE callback
  const currentPageRef = useRef(currentPage);
  const searchTermRef = useRef(searchTerm);
  const searchInputRef = useRef(searchInput);

  const loadContracts = useCallback(async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: recordsPerPage.toString(),
        search: search
      });
      
      const response = await fetch(`/api/contracts?${params}`);
      const data = await response.json();
      
      setContracts(data.contracts || data);
      setTotalContracts(data.total || (data.contracts || data).length);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }, [recordsPerPage]);

  // Update refs when state changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    searchInputRef.current = searchInput;
  }, [searchInput]);

  useEffect(() => {
    loadContracts(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadContracts]);

  useEffect(() => {
    // Setup Server-Sent Events for real-time updates (only once)
    const eventSource = new EventSource('/api/contracts/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_contract') {
        // Reload contracts using current ref values
        loadContracts(currentPageRef.current, searchTermRef.current);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [loadContracts]); // Only depends on loadContracts

  const handleSearch = () => {
    // Validar que el número de lote tenga exactamente 8 caracteres si se está buscando
    if (searchInput.trim() !== '' && searchInput.trim().length !== 8) {
      alert('El número de lote debe tener exactamente 8 caracteres');
      return;
    }
    setSearchTerm(searchInput.trim().toUpperCase());
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalContracts / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const viewSignature = async (contractId: number, lotNumber: string, fullName: string, timestamp: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/signature`);
      const data = await response.json();
      
      setSelectedSignature({
        id: contractId,
        lotNumber,
        fullName,
        timestamp,
        signatureData: data.signatureData
      });
    } catch (error) {
      console.error('Error loading signature:', error);
      alert('Error al cargar la firma');
    }
  };

  const openDeleteModal = (contractId: string, lotNumber: string, fullName: string) => {
    setDeleteData({ contractId, lotNumber, fullName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    
    // Cerrar modal inmediatamente
    setShowDeleteModal(false);
    setDeleteData(null);
    
    try {
      const response = await fetch(`/api/contracts/${deleteData.contractId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadContracts(currentPage, searchTerm);
      } else {
        throw new Error('Error al eliminar');
      }
    } catch {
      // Silenciar errores en consola
      loadContracts(currentPage, searchTerm);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteData(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStats = () => {
    const total = totalContracts;
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const todayCount = contracts.filter(contract => 
      new Date(contract.timestamp).toDateString() === today
    ).length;
    
    const weekCount = contracts.filter(contract => 
      new Date(contract.timestamp) >= weekAgo
    ).length;

    return { total, todayCount, weekCount };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-600 text-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 text-center shadow-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 tracking-wide leading-tight">
          Jorge Minnesota Logistics LLC
        </h1>
        <p className="text-sm sm:text-base lg:text-lg opacity-90 font-light">
          Registro de Contratos de Vehiculos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Red Car Animation */}
        <div className="bg-white p-4 sm:p-1 rounded-xl shadow-md border-l-4 border-red-600 flex items-center justify-center">
          <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
            <Lottie 
              animationData={redCarAnimation} 
              loop={true} 
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        
        {/* Stats Column */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-red-600">
            <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 sm:mb-2">
              {stats.todayCount}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Contratos Hoy</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-red-600">
            <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 sm:mb-2">
              {stats.weekCount}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Esta Semana</div>
          </div>
        </div>
        
        {/* Green Truck Animation */}
        <div className="bg-white p-4 sm:p-1 rounded-xl shadow-md border-l-4 border-green-600 flex items-center justify-center">
          <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
            <Lottie 
              animationData={greenTruckAnimation} 
              loop={true} 
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">Lista de Contratos</h2>
              <Link 
                href="/users"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl hover:shadow-md transition-all duration-200 font-medium backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Usuarios
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="Buscar"
                  value={searchInput}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 8) {
                      setSearchInput(value);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full sm:w-64 px-3 sm:px-4 py-2 rounded-xl bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-500 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm sm:text-base font-mono shadow-sm"
                  maxLength={8}
                />
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                  {searchInput.length}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searchInput.trim() !== '' && searchInput.trim().length !== 8}
                  className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 text-sm sm:text-base whitespace-nowrap flex items-center gap-2 font-medium ${
                    searchInput.trim() === '' || searchInput.trim().length === 8
                      ? 'bg-white/20 hover:bg-white/30 text-white cursor-pointer hover:shadow-md backdrop-blur-sm'
                      : 'bg-gray-300/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar
                </button>
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm sm:text-base whitespace-nowrap flex items-center gap-2 font-medium hover:shadow-md backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => loadContracts(currentPage, searchTerm)}
                  className="px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm sm:text-base whitespace-nowrap font-medium hover:shadow-md backdrop-blur-sm"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-xs sm:text-sm opacity-90 break-words">
            Mostrando {contracts.length} de {totalContracts} contratos
            {searchTerm && (
              <span className="block sm:inline"> (filtrado por: &quot;{searchTerm}&quot;)</span>
            )}
            {totalPages > 1 && (
              <span className="block sm:inline"> - Página {currentPage} de {totalPages}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <span className="text-sm sm:text-base">Cargando contratos...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <span className="text-sm sm:text-base">No hay contratos registrados</span>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-red-50/80 border-b border-red-200">
                  <tr>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800 w-12"></th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800">Teléfono</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800">Nombre</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800">Lote</th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800">Fecha y Hora</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-red-800">Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract, index) => (
                    <tr key={contract.id} className="border-b border-gray-100 hover:bg-red-50/50 transition-all duration-200">
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center text-white text-xs font-bold ${
                          index % 2 === 0 ? 'bg-red-500' : 'bg-red-600'
                        }`}>
                          {contract.id}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm font-mono">
                        <span className="block sm:hidden text-xs text-gray-500">Tel:</span>
                        <span className="break-all">{contract.phone_number || 'N/A'}</span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm font-medium">
                        <span className="block sm:hidden text-xs text-gray-500">Nombre:</span>
                        <span className="break-words">{contract.full_name || 'N/A'}</span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <span className="block sm:hidden text-xs text-gray-500">Lote:</span>
                        <span className="font-mono font-bold text-red-600 text-sm sm:text-base lg:text-lg break-all">
                          {contract.lot_number}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm text-gray-600">
                        {formatTimestamp(contract.timestamp)}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewSignature(
                              contract.id,
                              contract.lot_number,
                              contract.full_name || 'N/A',
                              contract.timestamp
                            )}
                            className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-red-500 text-white text-xs sm:text-sm rounded-xl hover:bg-red-600 hover:shadow-md transform hover:scale-105 transition-all duration-200 whitespace-nowrap cursor-pointer font-medium"
                          >
                            Ver Firma
                          </button>
                          <button
                            onClick={() => openDeleteModal(
                              contract.id.toString(),
                              contract.lot_number,
                              contract.full_name || 'N/A'
                            )}
                            className="p-1.5 sm:p-2 bg-red-400 text-white rounded-xl hover:bg-red-500 hover:shadow-lg transform hover:scale-110 transition-all duration-200 cursor-pointer group active:scale-95"
                            title={`Eliminar vehículo ${contract.lot_number}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="block sm:hidden text-xs text-gray-500 mt-1">
                          {formatTimestamp(contract.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 font-medium ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                    }`}
                  >
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  
                  <div className="flex gap-1 mx-2">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 1);
                        const end = Math.min(totalPages, start + 2);
                        pageNum = start + i;
                        if (pageNum > end) return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm min-w-[32px] sm:min-w-[36px] transition-all duration-200 font-medium ${
                            currentPage === pageNum
                              ? 'bg-red-500 text-white shadow-md'
                              : 'bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 font-medium ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                    }`}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 sm:mt-0 sm:ml-4">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {selectedSignature && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Firma del Contrato</h3>
              <button
                onClick={() => setSelectedSignature(null)}
                className="text-2xl sm:text-3xl lg:text-4xl text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-6">
              <p className="text-sm sm:text-base break-words"><strong>Nombre:</strong> <span className="text-red-600">{selectedSignature.fullName}</span></p>
              <p className="text-sm sm:text-base break-all"><strong>Lote:</strong> <span className="font-mono text-red-600">{selectedSignature.lotNumber}</span></p>
              <p className="text-sm sm:text-base"><strong>Fecha:</strong> {formatTimestamp(selectedSignature.timestamp)}</p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50/30">
              <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Firma Digital:</p>
              <div className="overflow-hidden rounded-xl bg-white border border-gray-100">
                <Image
                  src={selectedSignature.signatureData}
                  alt="Firma"
                  className="w-full max-w-full rounded-xl"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                  width={500}
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full mx-4 p-6 sm:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Confirmar Eliminación
              </h2>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                ¿Está seguro de que desea eliminar el vehículo del lote{' '}
                <span className="font-mono font-bold text-red-600">{deleteData.lotNumber}</span>{' '}
                de <span className="font-semibold text-red-600">{deleteData.fullName}</span>?
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 hover:shadow-md transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 sm:py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base cursor-pointer"
              >
                Eliminar Vehículo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}