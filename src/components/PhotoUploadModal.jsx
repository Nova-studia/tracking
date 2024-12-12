import React, { useState } from 'react';
import PropTypes from 'prop-types';

const PhotoUploadModal = ({ 
  isOpen = false, 
  onClose = () => {}, 
  onSubmit = () => {}, 
  vehicleId = '' 
}) => {
  const [photos, setPhotos] = useState({
    frontPhoto: null,
    backPhoto: null,
    leftPhoto: null,
    rightPhoto: null
  });
  const [previews, setPreviews] = useState({
    frontPhoto: null,
    backPhoto: null,
    leftPhoto: null,
    rightPhoto: null
  });
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (side, e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotos(prev => ({ ...prev, [side]: file }));
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [side]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) return;
    
    setLoading(true);

    try {
      // Crear FormData con las fotos
      const formData = new FormData();
      Object.entries(photos).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await onSubmit(formData);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error al subir las fotos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const photoInputs = [
    { id: 'frontPhoto', label: 'Frente del Vehículo' },
    { id: 'backPhoto', label: 'Parte Trasera' },
    { id: 'leftPhoto', label: 'Lado Izquierdo' },
    { id: 'rightPhoto', label: 'Lado Derecho' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Fotos del Vehículo</h2>
        <p className="text-sm text-slate-600 mb-4">
          Por favor, tome una foto de cada lado del vehículo antes de iniciar la carga.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {photoInputs.map(({ id, label }) => (
              <div key={id} className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                  {previews[id] ? (
                    <div className="relative">
                      <img 
                        src={previews[id]} 
                        alt={label} 
                        className="w-full h-40 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotos(prev => ({ ...prev, [id]: null }));
                          setPreviews(prev => ({ ...prev, [id]: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoChange(id, e)}
                        className="hidden"
                        id={`photo-${id}`}
                      />
                      <label
                        htmlFor={`photo-${id}`}
                        className="cursor-pointer text-sm text-slate-600 hover:text-slate-800"
                      >
                        <div className="border border-slate-300 rounded p-4 hover:bg-slate-50">
                          Tomar Foto
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !Object.values(photos).every(photo => photo)}
            >
              {loading ? 'Subiendo...' : 'Subir Fotos y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PhotoUploadModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  vehicleId: PropTypes.string
};

export default PhotoUploadModal;