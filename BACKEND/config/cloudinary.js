const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer para almacenamiento en memoria
const storage = multer.memoryStorage();

// Función para convertir buffer a stream
const bufferToStream = (buffer) => {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
  return readable;
};

// Configuración del middleware de Multer
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 4 // máximo 4 archivos
  },
  fileFilter: (req, file, cb) => {
    // Imprimir información sobre el archivo para depuración
    console.log('Archivo recibido:', file.fieldname, file.mimetype);
    
    // Verificar que sea una imagen
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'backPhoto', maxCount: 1 },
  { name: 'leftPhoto', maxCount: 1 },
  { name: 'rightPhoto', maxCount: 1 }
]);

module.exports = {
  uploadMiddleware,
  cloudinary,
  bufferToStream
};