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
  const [expandedNotification, setExpandedNotification] = useState(null);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth) return;
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    if (auth) {
      fetchNotifications();
    }
  }, [auth]);

  const handleLogin = (userData) => {
    setAuth(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setAuth(null);
  };

  // Cierra el panel de notificaciones cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationPanel = document.getElementById('notification-panel');
      const notificationButton = document.getElementById('notification-button');
      
      if (showNotifications && 
          notificationPanel && 
          !notificationPanel.contains(event.target) &&
          notificationButton && 
          !notificationButton.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const deleteNotification = async (notification, index) => {
    try {
      if (notification._id) {
        await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/${notification._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      const newNotifications = [...notifications];
      newNotifications.splice(index, 1);
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const queryParam = auth.role === 'admin' ? '?all=true' : '';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications${queryParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error eliminating notifications:', error);
    }
  };

  const toggleExpandNotification = (index) => {
    if (expandedNotification === index) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(index);
    }
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
        <div className="container mx-auto px-2 sm:px-4">
          <div className="h-16 flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="font-semibold text-sm sm:text-lg text-white">
                Administrador
              </span>
              <span className="text-xs sm:text-sm text-slate-300">
                {auth.role === 'admin' ? `${auth.username || auth.name}` : 'Conductor'}
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Icono de notificaciones */}
              <div className="relative">
                <button
                  id="notification-button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-800 active:bg-slate-700 transition-colors relative"
                  aria-label="Notificaciones"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-5 sm:w-5 flex items-center justify-center">
                      {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div 
                    id="notification-panel"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
                  >
                    <div className="py-2 flex flex-col max-h-[80vh]">
                      <div className="px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
                        <div className="flex items-center">
                          <span className="mr-2">Notificaciones</span>
                          {notifications.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {notifications.length}
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de eliminar todas las notificaciones?')) {
                                deleteAllNotifications();
                              }
                            }}
                            className="text-sm text-red-500 hover:text-red-700 focus:text-red-700 font-bold py-1 px-2 rounded transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                          >
                            Eliminar todas
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-grow">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p>No tienes notificaciones</p>
                          </div>
                        ) : (
                          notifications.map((notification, index) => (
                            <div 
                              key={index} 
                              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 relative transition-all ${
                                expandedNotification === index ? 'bg-gray-50' : ''
                              }`}
                            >
                              {/* Swipe actions container */}
                              <div className="flex items-center gap-3 mb-1 relative">
                                {notification.image ? (
                                  <img 
                                    src={notification.image} 
                                    alt="Notificación" 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <img 
                                      src="/icon.png" 
                                      alt="Carro" 
                                      className="w-8 h-8 sm:w-10 sm:h-10"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-grow">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-gray-900 text-base sm:text-base truncate">
                                      {notification.lotInfo || "Notificación"}
                                    </p>
                                    <div className="flex items-center">
                                      <button 
                                        onClick={() => deleteNotification(notification, index)}
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors ml-1"
                                        aria-label="Eliminar notificación"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <p className={`text-gray-600 text-sm ${
                                    expandedNotification === index ? '' : 'line-clamp-2'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-400">
                                      {notification.time || new Date(notification.createdAt).toLocaleString('es-ES', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {notification.message && notification.message.length > 80 && (
                                      <button 
                                        onClick={() => toggleExpandNotification(index)}
                                        className="text-xs text-blue-500 hover:text-blue-700 focus:outline-none"
                                      >
                                        {expandedNotification === index ? 'Ver menos' : 'Ver más'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
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
              setNotifications={setNotifications}
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