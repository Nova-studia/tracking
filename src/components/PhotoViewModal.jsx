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

  // Modal para vista completa de una foto
  const FullScreenPhoto = ({ photo, onClose }) => (
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
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={photos[photo.key].url}
          alt={photo.alt}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );

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