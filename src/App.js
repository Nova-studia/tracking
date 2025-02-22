import React, { useState, useEffect } from 'react';
import TransportesAdmin from './components/TransportesAdmin';
import Login from './components/Login';
import DriverDashboard from './components/DriverDashboard';

function App() {
  const [auth, setAuth] = useState(() => {
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-slate-900 text-white">
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
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto py-8">
          {auth.role === 'admin' ? (
            <TransportesAdmin />
          ) : (
            <DriverDashboard 
              driverId={auth.driverId || auth.id} 
            />
          )}
        </div>
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