import React from 'react';
import PropTypes from 'prop-types';

const PhotoViewModal = ({ isOpen, onClose, photos }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Fotos del Vehículo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {photos?.frontPhoto && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-600">Frente</p>
              <img
                src={`http://localhost:5000${photos.frontPhoto.url}`}
                alt="Frente del vehículo"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          {photos?.backPhoto && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-600">Parte Trasera</p>
              <img
                src={`http://localhost:5000${photos.backPhoto.url}`}
                alt="Parte trasera del vehículo"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          {photos?.leftPhoto && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-600">Lado Izquierdo</p>
              <img
                src={`http://localhost:5000${photos.leftPhoto.url}`}
                alt="Lado izquierdo del vehículo"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          {photos?.rightPhoto && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-600">Lado Derecho</p>
              <img
                src={`http://localhost:5000${photos.rightPhoto.url}`}
                alt="Lado derecho del vehículo"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
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