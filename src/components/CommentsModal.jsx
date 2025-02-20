import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CommentsModal = ({ isOpen, onClose, onSubmit, vehicle }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNewComment('');
    setIsSubmitting(false);
  }, [vehicle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      // Enviamos solo el texto del comentario
      await onSubmit(vehicle._id, newComment.trim());
      setNewComment('');
      onClose(); // Cerramos el modal después de un comentario exitoso
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Error al guardar el comentario. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Comentarios de Viaje</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Lista de comentarios existentes */}
        <div className="mb-4 max-h-60 overflow-y-auto">
          {vehicle.travelComments && vehicle.travelComments.length > 0 ? (
            <div className="space-y-2">
              {vehicle.travelComments.map((comment, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-slate-600">
                      {formatDate(comment.createdAt)}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                      {comment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">No hay comentarios</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            className="w-full h-32 p-3 border rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Agregar nuevo comentario..."
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Agregar Comentario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CommentsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  vehicle: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    travelComments: PropTypes.arrayOf(PropTypes.shape({
      comment: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
    }))
  })
};

export default CommentsModal;