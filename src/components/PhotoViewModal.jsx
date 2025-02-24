import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const PhotoViewModal = ({ isOpen, onClose, photos }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!isOpen) return null;

  const photoData = [
    { key: 'frontPhoto', label: 'Frente', alt: 'Frente del vehículo' },
    { key: 'backPhoto', label: 'Parte Trasera', alt: 'Parte trasera del vehículo' },
    { key: 'leftPhoto', label: 'Lado Izquierdo', alt: 'Lado izquierdo del vehículo' },
    { key: 'rightPhoto', label: 'Lado Derecho', alt: 'Lado derecho del vehículo' }
  ];

  // Modal para vista completa de una foto con navegación
  const FullScreenPhoto = ({ photo, onClose }) => {
    const availablePhotos = photoData.filter(p => photos[p.key]);
    const currentIndex = availablePhotos.findIndex(p => p.key === photo.key);
    
    const goToNext = () => {
      const nextIndex = (currentIndex + 1) % availablePhotos.length;
      setSelectedPhoto(availablePhotos[nextIndex]);
    };
    
    const goToPrevious = () => {
      const prevIndex = (currentIndex - 1 + availablePhotos.length) % availablePhotos.length;
      setSelectedPhoto(availablePhotos[prevIndex]);
    };

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-black bg-opacity-75">
          <h3 className="text-white text-lg">{photo.label}</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {/* Botón de navegación a la izquierda */}
          <button 
            onClick={goToPrevious}
            className="absolute left-4 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <img
            src={photos[photo.key].url}
            alt={photo.alt}
            className="max-h-full max-w-full object-contain"
          />
          
          {/* Botón de navegación a la derecha */}
          <button 
            onClick={goToNext}
            className="absolute right-4 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        {/* Indicadores de navegación */}
        <div className="flex justify-center p-4">
          {availablePhotos.map((p, idx) => (
            <button 
              key={p.key}
              onClick={() => setSelectedPhoto(p)}
              className={`w-2 h-2 mx-1 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-gray-500'}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Fotos del Vehículo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photoData.map((photo) => {
              if (!photos[photo.key]) return null;
              
              return (
                <div key={photo.key} className="space-y-2 group relative">
                  <p className="font-medium text-gray-700">{photo.label}</p>
                  <div className="relative overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={photos[photo.key].url}
                      alt={photo.alt}
                      className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity"
                    >
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <FullScreenPhoto
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

PhotoViewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  photos: PropTypes.shape({
    frontPhoto: PropTypes.shape({
      url: PropTypes.string,
      uploadedAt: PropTypes.string
    }),
    backPhoto: PropTypes.shape({
      url: PropTypes.string,
      uploadedAt: PropTypes.string
    }),
    leftPhoto: PropTypes.shape({
      url: PropTypes.string,
      uploadedAt: PropTypes.string
    }),
    rightPhoto: PropTypes.shape({
      url: PropTypes.string,
      uploadedAt: PropTypes.string
    })
  })
};

export default PhotoViewModal;