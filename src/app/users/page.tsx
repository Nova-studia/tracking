'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Lottie from 'lottie-react';
import redCarAnimation from '../../../public/Red Car.json';
import greenTruckAnimation from '../../../public/Green Trucks.json';

interface Contract {
  _id: string;
  lot_number: string;
  signature_data: string;
  timestamp: string;
  ip_address?: string;
}

interface User {
  phone_number: string;
  full_name: string;
  address: string;
  gatepass: string;
  contracts: Contract[];
  contract_count: number;
  first_contract: string;
  last_contract: string;
}

interface ApiResponse {
  success: boolean;
  users: User[];
  total: number;
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = (phoneNumber: string) => {
    setExpandedUser(expandedUser === phoneNumber ? null : phoneNumber);
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
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg">{error}</div>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
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
            <p className="text-gray-100 text-xl">Registro de Usuarios del Sistema</p>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-8 border-l-4 border-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-black mb-2">
                  {users.filter(user => {
                    const lastContractDate = new Date(user.last_contract);
                    const today = new Date();
                    return lastContractDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <p className="text-gray-600 text-lg font-medium">Usuarios Hoy</p>
              </div>
              <div className="w-40 h-40 flex-shrink-0">
                <Lottie 
                  animationData={redCarAnimation} 
                  loop={true} 
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-l-4 border-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-black mb-2">
                  {users.filter(user => {
                    const lastContractDate = new Date(user.last_contract);
                    const today = new Date();
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return lastContractDate >= weekStart && lastContractDate <= today;
                  }).length}
                </div>
                <p className="text-gray-600 text-lg font-medium">Esta Semana</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-green-600 mb-2">{users.length}</div>
                <p className="text-gray-600 text-lg font-medium">Total Usuarios</p>
              </div>
              <div className="w-40 h-40 flex-shrink-0">
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
        {/* Lista de Usuarios Section */}
        <div className="bg-black text-white p-4 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold">Lista de Usuarios</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link
                href="/admin"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium">
                Actualizar
              </button>
            </div>
          </div>
          
          <div className="text-sm opacity-90">
            Mostrando {users.length} usuarios registrados
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-black mx-auto mb-4"></div>
            <span className="text-sm sm:text-base text-gray-500">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
              <p className="text-gray-500 mb-6">Los usuarios aparecerán aquí cuando se registren contratos en el sistema</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden">
            {/* Table Headers */}
            <div className="bg-white border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700">
                <div className="col-span-1"></div>
                <div className="col-span-2">Teléfono</div>
                <div className="col-span-2">Nombre</div>
                <div className="col-span-2">Dirección</div>
                <div className="col-span-3">Último Contrato</div>
                <div className="col-span-2">Contratos</div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <div key={user.phone_number}>
                  <div 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleUserExpansion(user.phone_number)}
                  >
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                      <div className="col-span-1">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-gray-900">
                        {user.phone_number}
                      </div>
                      <div className="col-span-2 text-sm text-gray-900">
                        {user.full_name || 'N/A'}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">
                          {user.address || 'N/A'}
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-gray-600">
                        {formatDate(user.last_contract)}
                      </div>
                      <div className="col-span-2 flex gap-2 items-center">
                        <span className="px-3 py-1 bg-black text-white text-sm rounded font-medium">
                          {user.contract_count} contrato{user.contract_count !== 1 ? 's' : ''}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                          expandedUser === user.phone_number ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
                        }`}>
                          <svg 
                            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                              expandedUser === user.phone_number ? 'rotate-180' : ''
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

                  {expandedUser === user.phone_number && (
                    <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-md font-semibold text-gray-900">
                          Historial de Contratos
                        </h4>
                        <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-medium">
                          {user.contracts.length}
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {user.contracts.map((contract, contractIndex) => (
                          <div key={contract._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                                  contractIndex % 2 === 0 ? 'bg-black' : 'bg-gray-800'
                                }`}>
                                  {contract.lot_number.slice(-2)}
                                </div>
                                <div>
                                  <p className="font-mono font-semibold text-gray-900 text-sm">
                                    {contract.lot_number}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(contract.timestamp)}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href={`/api/contracts/${contract._id}`}
                                className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium rounded-lg transition-colors"
                                target="_blank"
                              >
                                Ver
                              </Link>
                            </div>
                            {contract.ip_address && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                </svg>
                                {contract.ip_address}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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