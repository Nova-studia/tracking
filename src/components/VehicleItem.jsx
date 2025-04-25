import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pencil, Trash2, ChevronDown, ChevronUp, Car, MapPin, Calendar, User, ArrowRight, MessageSquare } from 'lucide-react';

const VehicleItem = ({
  vehicle,
  index,
  clients,
  getClientName,
  getLocation,
  formatDate,
  getStatusBadge,
  getProgressBar,
  openClientModal,
  openCommentsModal,
  openPhotoModal,
  openDriverModal,
  handleDelete,
  onUpdateStatus,
  display
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get action buttons for the vehicle
  const getActionButtons = () => {
    const buttons = [];
    
    buttons.push(
      <button
        key="delete-button"
        onClick={() => handleDelete(vehicle._id)}
        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full"
        title="Eliminar vehículo"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  
    if (vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0) {
      buttons.push(
        <button
          key="view-photos"
          onClick={() => openPhotoModal(vehicle.loadingPhotos)}
          className="text-xs px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          Ver Fotos
        </button>
      );
    }

    if (vehicle.status === 'delivered') {
      if (buttons.length === 0) {
        buttons.push(
          <div key="placeholder" className="w-24" />
        );
      }
      return buttons;
    }

    if (vehicle.status === 'pending' || vehicle.status === 'assigned' || vehicle.status === 'loading') {
      buttons.push(
        <button
          key="assign-driver"
          onClick={() => openDriverModal(vehicle)}
          className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
        >
          <User className="h-3 w-3" />
          <span>
            {vehicle.status === 'pending' ? 'Asignar' : 'Reasignar'} Conductor
          </span>
        </button>
      );
    }

    // Simplified button configuration - removed 'loading' button, only keep 'in-transit'
    const buttonConfig = {
      assigned: {
        action: 'in-transit',
        text: 'Iniciar Viaje',
        className: 'bg-black text-white',
      },
      loading: {
        action: 'in-transit',
        text: 'Iniciar Viaje',
        className: 'bg-black text-white',
      },
      'in-transit': {
        action: 'delivered',
        text: 'Entregar',
        className: 'bg-black text-white',
      }
    };

    const config = buttonConfig[vehicle.status];
    if (config) {
      buttons.push(
        <button
          key="status-button"
          onClick={() => onUpdateStatus(
            vehicle._id, 
            config.action, 
            `Vehículo ${config.action === 'in-transit' ? 'en tránsito' : 'entregado'}`
          )}
          className={`text-xs px-3 py-1 rounded ${config.className}`}
        >
          {config.text}
        </button>
      );
    }

    return buttons;
  };

  // Table row view for desktop
  if (display === 'table') {
    return (
      <tr 
        className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
      >
        <td className="px-3 py-2">
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
            <span className="text-xs text-gray-500 mt-0.5">Creado: {formatDate(vehicle.createdAt)}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col">
            <span className="text-gray-700">LOT: {vehicle.LOT || '-'}</span>
            <span className="text-xs text-gray-500 mt-0.5">PIN: {vehicle.PIN || '-'}</span>
            <span className="text-xs text-gray-500 mt-0.5">Casa: {vehicle.auctionHouse || '-'}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-4 w-4 text-gray-400 mr-2" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-gray-700 truncate max-w-[120px]">{getClientName(vehicle)}</span>
                <button
                  onClick={() => openClientModal(vehicle)}
                  className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-700 truncate max-w-[160px]">{getLocation(vehicle)}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col space-y-2">
            {getStatusBadge(vehicle.status)}
            <div className="mt-1 w-24">
              {getProgressBar(vehicle.status)}
            </div>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap justify-center gap-1">
            <button
              onClick={() => openCommentsModal(vehicle)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              title={vehicle.comments || 'Sin comentarios'}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            
            {getActionButtons()}
          </div>
        </td>
      </tr>
    );
  }

  // Card view for mobile
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden mb-2">
      <div className="p-3 flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Car className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <span className="font-medium text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
            <div className="ml-auto">
              {getStatusBadge(vehicle.status)}
            </div>
          </div>
          <div className="flex flex-wrap items-center mt-2">
            <div className="flex items-center mr-3">
              <span className="text-xs text-gray-500">LOT: {vehicle.LOT}</span>
            </div>
            <div className="flex items-center mr-3">
              <Calendar className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">{formatDate(vehicle.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500 truncate max-w-[160px]">{getLocation(vehicle)}</span>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3 mb-4">
            {getProgressBar(vehicle.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">{new Date(vehicle.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{getLocation(vehicle)}</span>
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">PIN#:</span>
              <span className="text-xs text-gray-600">{vehicle.PIN || '-'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">{vehicle.auctionHouse || '-'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{getClientName(vehicle)}</span>
            </div>
          </div>
  
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openCommentsModal(vehicle);
              }}
              className="flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-100"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Comentarios</span>
            </button>
            
            {vehicle.loadingPhotos && Object.keys(vehicle.loadingPhotos).length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPhotoModal(vehicle.loadingPhotos);
                }}
                className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-100"
              >
                Ver Fotos
              </button>
            )}
            
            {getActionButtons().map((button, index) => (
              <span key={index} onClick={e => e.stopPropagation()}>
                {button}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

VehicleItem.propTypes = {
  vehicle: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    year: PropTypes.string,
    LOT: PropTypes.string,
    PIN: PropTypes.string,
    auctionHouse: PropTypes.string,
    status: PropTypes.string.isRequired,
    comments: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    lotLocation: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    clientId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }),
      PropTypes.oneOf([null])
    ]),
    driverId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }),
      PropTypes.oneOf([null])
    ]),
    loadingPhotos: PropTypes.object
  }).isRequired,
  index: PropTypes.number,
  clients: PropTypes.array.isRequired,
  getClientName: PropTypes.func.isRequired,
  getLocation: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusBadge: PropTypes.func.isRequired,
  getProgressBar: PropTypes.func.isRequired,
  openClientModal: PropTypes.func.isRequired,
  openCommentsModal: PropTypes.func.isRequired,
  openPhotoModal: PropTypes.func.isRequired,
  openDriverModal: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  display: PropTypes.oneOf(['table', 'card']).isRequired
};

export default VehicleItem;