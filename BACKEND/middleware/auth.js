const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Obtener token del header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }
  
  // Extraer el token desde el formato "Bearer [token]"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7, authHeader.length) 
    : authHeader;
  
  try {
    // Verificar token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', verified); // Importante: agregar este log
    
    // Añadir datos del usuario al objeto request para usar en rutas protegidas
req.user = {
  id: verified.id,
  username: verified.username,
  role: verified.role,
  partnerGroup: verified.partnerGroup || 'main',
  isMainAdmin: verified.isMainAdmin || false,
  driverId: verified.driverId || null // Añadir driverId del token
};
    
    console.log('Usuario extraído del token:', req.user); // Importante: agregar este log
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = auth;