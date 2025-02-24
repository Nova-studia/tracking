import React, { useState } from 'react';
import PropTypes from 'prop-types';

const PhotoUploadModal = ({ isOpen, onClose, onSubmit }) => {
  const [photos, setPhotos] = useState({
    frontPhoto: null,
    backPhoto: null,
    leftPhoto: null,
    rightPhoto: null
  });
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para comprimir imágenes
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a Blob con calidad reducida
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7); // 70% de calidad
        };
      };
    });
  };

  const handleFileChange = async (e, photoType) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, seleccione una imagen válida');
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB');
      }

      // Comprimir imagen
      const compressedFile = await compressImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({
          ...prev,
          [photoType]: reader.result
        }));
      };
      reader.readAsDataURL(compressedFile);

      // Guardar archivo comprimido
      setPhotos(prev => ({
        ...prev,
        [photoType]: compressedFile
      }));
      
      setError(null);
    } catch (err) {
      setError(err.message);
      // Limpiar el input file
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Verificar si hay al menos una foto
      const hasPhotos = Object.values(photos).some(photo => photo !== null);
      if (!hasPhotos) {
        throw new Error('Por favor, seleccione al menos una foto');
      }

      // Agregar solo las fotos que existen
      Object.entries(photos).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al subir las fotos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Fotos del Vehículo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Por favor, tome una foto de cada lado del vehículo antes de iniciar la carga.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'frontPhoto', label: 'Frente del Vehículo' },
              { key: 'backPhoto', label: 'Parte Trasera' },
              { key: 'leftPhoto', label: 'Lado Izquierdo' },
              { key: 'rightPhoto', label: 'Lado Derecho' }
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <p className="font-medium text-sm text-gray-600">{label}</p>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-2">
                  {previews[key] ? (
                    <div className="relative">
                      <img
                        src={previews[key]}
                        alt={label}
                        className="w-full h-48 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotos(prev => ({ ...prev, [key]: null }));
                          setPreviews(prev => ({ ...prev, [key]: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="mt-2 text-sm text-gray-500">Subir o tomar foto</span>
                      <input
  type="file"
  accept="image/*"
  className="hidden"
  onChange={e => handleFileChange(e, key)}
/>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Subiendo...' : 'Subir Fotos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PhotoUploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default PhotoUploadModal;