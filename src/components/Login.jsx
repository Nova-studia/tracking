import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!credentials.username || !credentials.password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Llamar al callback con los datos del usuario
      onLogin(data.user);
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Sistema de Transportes
            </h1>
            <p className="text-slate-600 mt-2">
              Ingrese sus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-slate-700"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Ingrese su usuario"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Ingrese su contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600">
          <p>
            ¿Necesita ayuda? Contacte al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;