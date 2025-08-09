'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Contract {
  id: number;
  phone_number: string;
  lot_number: string;
  full_name: string;
  address: string;
  gatepass: string;
  timestamp: string;
  signature_data: string;
  ip_address?: string;
}

export default function ViajePage({ params }: { params: Promise<{ id: string }> }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${id}`);
      
      if (!response.ok) {
        throw new Error('Contrato no encontrado');
      }
      
      const data = await response.json();
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/^\w/, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <span className="text-gray-500">Cargando información del viaje...</span>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contrato no encontrado</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-black rounded-3xl shadow-lg mb-8 overflow-hidden text-white">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Información del Viaje</h1>
                <p className="text-gray-200">Detalles completos del contrato</p>
              </div>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del Cliente */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Información del Cliente
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nombre Completo:</span>
                <span className="text-gray-900 font-semibold">{contract.full_name || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Teléfono:</span>
                <span className="text-gray-900 font-mono font-semibold">{contract.phone_number}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Dirección:</span>
                <span className="text-gray-900">{contract.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Información del Viaje */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-2-2m0 0l-2 2m2-2v-4M4 13l2-2m0 0l2 2m-2-2v-4" />
                </svg>
              </div>
              Información del Viaje
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Número de Lote:</span>
                <span className="text-2xl font-bold text-black font-mono">{contract.lot_number}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Gatepass:</span>
                <span className="text-gray-900 font-mono font-semibold">{contract.gatepass || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Fecha y Hora:</span>
                <span className="text-gray-900 font-semibold">{formatDate(contract.timestamp)}</span>
              </div>
              
              {contract.ip_address && contract.ip_address !== '::1' && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">IP Address:</span>
                  <span className="text-gray-900 font-mono">{contract.ip_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Firma Digital */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            Firma Digital del Cliente
          </h2>
          
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
            <div className="flex justify-center">
              <Image
                src={contract.signature_data}
                alt="Firma del cliente"
                className="max-w-full h-auto rounded-lg shadow-sm bg-white p-4"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
                width={600}
                height={300}
              />
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Firma registrada el {formatDate(contract.timestamp)}
          </div>
        </div>

        {/* Company Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © Jorge Minnesota Logistics LLC - Sistema de Registro de Contratos
          </p>
        </div>
      </div>
    </div>
  );
}