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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg">{error}</div>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                      {users.length} usuarios
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Total: {users.reduce((sum, user) => sum + user.contract_count, 0)} contratos registrados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Admin
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
          {users.map((user, index) => (
            <div key={user.phone_number} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleUserExpansion(user.phone_number)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    {/* User Avatar with initial */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                      index % 2 === 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {user.full_name || 'Usuario sin nombre'}
                        </h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          user.contract_count > 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.contract_count} contrato{user.contract_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-mono">{user.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{user.address || 'Sin dirección'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(user.last_contract)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
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
                <div className="border-t border-gray-100 bg-gray-50/30 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-md font-semibold text-gray-900">
                      Historial de Contratos
                    </h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {user.contracts.length}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {user.contracts.map((contract, contractIndex) => (
                      <div key={contract._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                              contractIndex % 2 === 0 ? 'bg-red-500' : 'bg-green-500'
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
                            className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium rounded-lg transition-colors"
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

          {users.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
                <p className="text-gray-500 mb-6">Los usuarios aparecerán aquí cuando se registren contratos en el sistema</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear primer contrato
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}