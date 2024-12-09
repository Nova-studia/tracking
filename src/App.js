import React, { useState } from 'react';
import TransportesAdmin from './components/TransportesAdmin';
import Login from './components/Login';
import DriverDashboard from './components/DriverDashboard';

function App() {
  const [auth, setAuth] = useState(null);

  const handleLogin = (userData) => {
    setAuth(userData);
  };

  const handleLogout = () => {
    setAuth(null);
  };

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <span>Bienvenido, {auth.username}</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
        >
          Cerrar Sesión
        </button>
      </div>
      
      {auth.role === 'admin' ? (
        <TransportesAdmin />
      ) : (
        <DriverDashboard driverId={auth.username} />
      )}
    </div>
  );
}

export default App;