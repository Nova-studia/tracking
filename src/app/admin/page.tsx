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
  gatepass: string;
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
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
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

  const toggleContractExpansion = (contractId: number) => {
    setExpandedContract(expandedContract === contractId ? null : contractId);
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


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header with Lottie animations */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Lottie Animation */}
            <div className="lg:w-32 h-24 lg:h-32 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
              <div className="w-20 h-20 lg:w-24 lg:h-24">
                <Lottie 
                  animationData={redCarAnimation} 
                  loop={true} 
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
                    <div className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                      {contracts.length} contratos
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Total: {totalContracts} contratos registrados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/users"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Usuarios
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Inicio
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Right Lottie Animation */}
            <div className="lg:w-32 h-24 lg:h-32 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
              <div className="w-20 h-20 lg:w-24 lg:h-24">
                <Lottie 
                  animationData={greenTruckAnimation} 
                  loop={true} 
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
        {/* Search Section */}
        <div className="bg-red-600 text-white p-4 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Buscar Contratos</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="Número de lote"
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
                  className="w-full sm:w-64 px-3 sm:px-4 py-2 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base font-mono"
                  maxLength={8}
                />
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                  {searchInput.length}/8
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searchInput.trim() !== '' && searchInput.trim().length !== 8}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    searchInput.trim() === '' || searchInput.trim().length === 8
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-gray-300/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Buscar
                </button>
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm opacity-90">
            Mostrando {contracts.length} de {totalContracts} contratos
            {searchTerm && (
              <span> • Filtrado por: &quot;{searchTerm}&quot;</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <span className="text-sm sm:text-base text-gray-500">Cargando contratos...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 11l1.5-4.5h11L19 11H5zm1.5 5c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v7c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-7l-2.08-5.99z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos registrados</h3>
              <p className="text-gray-500 mb-6">Los contratos aparecerán aquí cuando se registren en el sistema</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract, index) => (
              <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleContractExpansion(contract.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Contract Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        index % 2 === 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {contract.lot_number.slice(-2)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 font-mono">
                            {contract.lot_number}
                          </h3>
                          <span className="px-3 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                            Contrato
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">{contract.full_name || 'Sin nombre'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="font-mono">{contract.phone_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-mono">{contract.gatepass || 'Sin Gatepass'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {new Date(contract.timestamp).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short'
                              })} - {new Date(contract.timestamp).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        expandedContract === contract.id ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                        <svg 
                          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                            expandedContract === contract.id ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedContract === contract.id && (
                  <div className="border-t border-gray-100 bg-gray-50/30 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-md font-semibold text-gray-900">
                        Detalles del Contrato
                      </h4>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</label>
                            <p className="text-sm text-gray-900 mt-1">{contract.address || 'Sin dirección'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha completa</label>
                            <p className="text-sm text-gray-900 mt-1">{formatTimestamp(contract.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewSignature(
                              contract.id,
                              contract.lot_number,
                              contract.full_name || 'N/A',
                              contract.timestamp
                            );
                          }}
                          className="px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Firma Digital
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(
                              contract.id.toString(),
                              contract.lot_number,
                              contract.full_name || 'N/A'
                            );
                          }}
                          className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar Contrato
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 font-medium ${
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
                      className={`px-3 py-2 rounded-xl text-sm min-w-[36px] transition-all duration-200 font-medium ${
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
                className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 font-medium ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                }`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500 mt-2 sm:mt-0">
              Página {currentPage} de {totalPages}
            </div>
          </div>
        )}
        </div>
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