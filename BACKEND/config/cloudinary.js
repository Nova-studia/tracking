// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Limitar tamaño máximo
      { quality: 'auto' }, // Optimización automática
      { format: 'webp' } // Convertir a WebP
    ]
  }
});

const uploadMiddleware = multer({ storage: storage }).fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'backPhoto', maxCount: 1 },
  { name: 'leftPhoto', maxCount: 1 },
  { name: 'rightPhoto', maxCount: 1 }
]);

module.exports = {
  cloudinary,
  uploadMiddleware
};