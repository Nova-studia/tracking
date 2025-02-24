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
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem('notificationsData');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notificationsData', JSON.stringify(notifications));
    } else {
      localStorage.removeItem('notificationsData');
    }
  }, [notifications]);

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

               {/* Agregar este bloque de código para el icono de notificaciones */}
               <div className="relative">
  <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="p-2 rounded-full hover:bg-slate-800 transition-colors relative"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {notifications.length > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {notifications.length}
      </span>
    )}
  </button>
    
  {showNotifications && notifications.length > 0 && (
  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50">
    <div className="py-2">
      <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 flex justify-between items-center">
        <span>Notificaciones</span>
        <button 
  onClick={() => {
    setNotifications([]);
    localStorage.removeItem('notificationsData');
  }}
  className="text-xs text-red-500 hover:text-red-700"
>
  Eliminar todas
</button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {notifications.map((notification, index) => (
          <div key={index} className="px-4 py-3 text-sm border-b hover:bg-gray-50 relative">
            <button 
  onClick={() => {
    const newNotifications = [...notifications];
    newNotifications.splice(index, 1);
    setNotifications(newNotifications);
    localStorage.setItem('notificationsData', JSON.stringify(newNotifications));
  }}
  className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center">
            {notification.image ? (
  <img 
    src={notification.image} 
    alt="Notificación" 
    className="w-8 h-8 rounded-full mr-2 object-cover"
  />
) : (
  <img 
    src="/sport-car.png" 
    alt="Carro" 
    className="w-8 h-8 mr-2"
  />
)}
              <div>
                <p className="font-medium text-gray-900">{notification.lotInfo || ""}</p>
                <p className="text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
  </div>
  {/* Fin del bloque de notificaciones */}

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
  <TransportesAdmin setNotifications={setNotifications} />
) : (
  <DriverDashboard 
    driverId={auth.driverId || auth.id} 
    setNotifications={setNotifications}  // También pasar a DriverDashboard
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