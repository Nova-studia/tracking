import React, { useState, useEffect } from 'react';
import TransportesAdmin from './components/TransportesAdmin';
import Login from './components/Login';
import DriverDashboard from './components/DriverDashboard';

function App() {
  const [auth, setAuth] = useState(() => {
    // Intentar recuperar la información de autenticación del localStorage
    const savedAuth = localStorage.getItem('userData');
    return savedAuth ? JSON.parse(savedAuth) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuth(null);
        setLoading(false);
        return;
      }

      try {
        // Aquí podrías hacer una petición al servidor para validar el token
        // Por ahora solo verificamos que existe el token y los datos del usuario
        const userData = localStorage.getItem('userData');
        if (!userData) {
          throw new Error('No user data found');
        }
        
        setAuth(JSON.parse(userData));
      } catch (error) {
        console.error('Error validating session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleLogin = (userData) => {
    setAuth(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setAuth(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-lg">
                Sistema de Transportes
              </span>
              <span className="text-slate-300">
                |
              </span>
              <span className="text-slate-300">
                {auth.role === 'admin' ? 'Administrador' : 'Conductor'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-slate-300">
                {auth.name || auth.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {auth.role === 'admin' ? (
          <TransportesAdmin />
        ) : (
          <DriverDashboard 
            driverId={auth.driverId || auth.id} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} Sistema de Transportes. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;