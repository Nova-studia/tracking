'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Lottie from 'lottie-react';
import redCarAnimation from '../../../../public/Red Car.json';
import greenTruckAnimation from '../../../../public/Green Trucks.json';

interface Contract {
  _id: string;
  lot_number: string;
  signature_data: string;
  timestamp: string;
  ip_address?: string;
}

interface UserDetails {
  phone_number: string;
  full_name: string;
  address: string;
  gatepass: string;
  owner_name: string;
  owner_phone: string;
  contracts: Contract[];
  contract_count: number;
  first_contract: string;
  last_contract: string;
}

interface ApiResponse {
  success: boolean;
  user: UserDetails;
  error?: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const phone = params.phone as string;
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phone) {
      fetchUserDetails();
    }
  }, [phone]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${encodeURIComponent(phone)}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setUser(data.user);
      } else {
        setError(data.error || 'Error al cargar información del usuario');
      }
    } catch (err) {
      setError('Error de conexión');
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

  const formatPhoneForDisplay = (phoneNumber: string) => {
    // Remove country code and format as (XXX) XXX-XXXX
    const cleaned = phoneNumber.replace(/^\+\d+/, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Usuario no encontrado</h3>
          <p className="text-gray-500 mb-6">{error || 'No se pudo cargar la información del usuario'}</p>
          <Link
            href="/users"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver a Usuarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-4">
        {/* Header */}
        <div className="bg-black rounded-3xl shadow-lg mb-8 overflow-hidden text-white">
          <div className="px-12 py-8 text-center">
            <h1 className="text-4xl font-bold mb-3">Jorge Minnesota Logistics LLC</h1>
            <p className="text-gray-100 text-xl">Información del Usuario</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex justify-start">
          <Link
            href="/users"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Usuarios
          </Link>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Usuario del Contrato */}
          <div className="bg-white rounded-3xl p-8 border-l-4 border-black shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-black rounded-full mr-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Usuario</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nombre</p>
                <p className="text-lg text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                <p className="text-lg font-mono text-gray-900">{formatPhoneForDisplay(user.phone_number)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Dirección</p>
                <p className="text-gray-900">{user.address}</p>
              </div>
            </div>
          </div>

          {/* Dueño de la Cuenta */}
          <div className="bg-white rounded-3xl p-8 border-l-4 border-black shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-black rounded-full mr-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Propietario</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nombre</p>
                <p className="text-lg text-gray-900">{user.owner_name || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                <p className="text-lg font-mono text-gray-900">{user.owner_phone ? formatPhoneForDisplay(user.owner_phone) : 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-white rounded-3xl p-8 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-green-500 rounded-full mr-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Datos</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Gatepass</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black text-white">
                  {user.gatepass}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Contratos</p>
                  <p className="text-5xl font-bold text-green-600">{user.contract_count}</p>
                </div>
                <div className="w-20 h-20 flex-shrink-0">
                  <Lottie 
                    animationData={greenTruckAnimation} 
                    loop={true} 
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Primer contrato</p>
                <p className="text-gray-900">{formatDate(user.first_contract).split(',')[0]}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Contracts History - Modern List */}
        <div className="space-y-3">
          <div className="bg-black text-white p-4 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">Historial de Contratos</h2>
              <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">
                {user.contracts.length} contrato{user.contracts.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="text-sm opacity-90">
              Mostrando todos los contratos del usuario
            </div>
          </div>

          {user.contracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos registrados</h3>
                <p className="text-gray-500 mb-6">Los contratos aparecerán aquí cuando se registren en el sistema</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {user.contracts.map((contract, index) => (
                  <div key={contract._id}>
                    <div className="hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                        <div className="col-span-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-900">#{index + 1}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm text-gray-900">
                          <span className="font-mono font-semibold">{contract.lot_number}</span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                            {user.gatepass}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-600">
                          {formatDate(contract.timestamp)}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 font-mono">
                          {contract.ip_address && contract.ip_address !== '::1' ? contract.ip_address : 'Local'}
                        </div>
                        <div className="col-span-2 flex gap-2 items-center">
                          <Link
                            href={`/viaje/${contract._id}`}
                            target="_blank"
                            className="px-2 py-1 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Ver Detalle
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}