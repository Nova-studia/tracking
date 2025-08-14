'use client';

import { useState, useRef, useEffect } from 'react';

interface UserData {
  phone_number: string;
  full_name: string;
  address: string;
  gatepass: string;
  owner_name: string;
  owner_phone: string;
}

export default function ContractForm() {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [gatepass, setGatepass] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{contractId: number, lotNumber: string, fullName: string} | null>(null);
  const [lotCheckMessage, setLotCheckMessage] = useState('');
  const [lotCheckType, setLotCheckType] = useState<'success' | 'error' | ''>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Set drawing properties
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Prevent scrolling when touching the canvas
    const preventTouch = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    canvas.addEventListener('touchend', preventTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
      canvas.removeEventListener('touchend', preventTouch);
    };
  }, []);

  // Get coordinates from event
  const getCoordinates = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Start drawing
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    setHasSignature(true);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Continue drawing
  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCoordinates(e.nativeEvent, canvas);
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCoordinates(e.nativeEvent, canvas);
    draw(x, y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    
    const { x, y } = getCoordinates(e.touches[0] as Touch, canvas);
    startDrawing(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    
    const { x, y } = getCoordinates(e.touches[0] as Touch, canvas);
    draw(x, y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${countryCode}${digits}`;
  };

  const checkPhone = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits || digits.length !== 10) {
      setMessage('Por favor, ingrese un número de teléfono válido de 10 dígitos.');
      setMessageType('error');
      return;
    }

    setMessage('');
    setMessageType('');
    setIsLoading(true);

    try {
      const fullPhone = getFullPhoneNumber();
      const response = await fetch(`/api/check-phone/${encodeURIComponent(fullPhone)}`);
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      console.log('Phone check response:', data); // Debug log

      if (data.exists && data.userData) {
        // Usuario existente
        setUserData(data.userData);
        setPhoneVerified(true);
        // Pre-llenar los campos si existen
        if (data.userData.gatepass) {
          setGatepass(data.userData.gatepass);
        }
        if (data.userData.owner_name) {
          setOwnerName(data.userData.owner_name);
        }
        if (data.userData.owner_phone) {
          setOwnerPhone(data.userData.owner_phone);
        }
        setMessage('Teléfono verificado - Cliente existente. Proceda con el número de lote.');
        setMessageType('success');
        console.log('✅ Existing user verified:', data.userData);
      } else {
        // Usuario nuevo
        setUserData(null);
        setPhoneVerified(true);
        setMessage('Teléfono nuevo - Complete nombre, dirección y número de lote.');
        setMessageType('success');
        console.log('✅ New user verified');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      setMessage('Error al verificar el teléfono. Intente nuevamente.');
      setMessageType('error');
      setPhoneVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submission - phoneVerified:', phoneVerified, 'userData:', userData); // Debug log

    if (!phoneVerified) {
      setMessage('Paso faltante: Debe hacer clic en "Verificar" junto al número de teléfono antes de continuar.');
      setMessageType('error');
      // Scroll to phone field
      document.getElementById('phoneNumber')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!lotNumber || lotNumber.length !== 8) {
      setMessage('Por favor, ingrese un número de lote válido de 8 dígitos.');
      setMessageType('error');
      return;
    }

    if (lotCheckType === 'error') {
      setMessage('Este número de lote ya ha sido registrado. Por favor, use otro número.');
      setMessageType('error');
      return;
    }

    if (!gatepass.trim()) {
      setMessage('Por favor, ingrese el número de Gatepass.');
      setMessageType('error');
      return;
    }

    if (!userData && (!fullName.trim() || !address.trim() || !ownerName.trim() || !ownerPhone.trim())) {
      setMessage('Por favor, complete todos los campos requeridos.');
      setMessageType('error');
      return;
    }

    if (!hasSignature) {
      setMessage('Por favor, firme el contrato antes de continuar.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas no disponible');

      const signatureData = canvas.toDataURL();

      const requestData = {
        phoneNumber: getFullPhoneNumber(),
        lotNumber: lotNumber.toUpperCase(),
        fullName: userData ? userData.full_name : fullName,
        address: userData ? userData.address : address,
        gatepass: gatepass,
        ownerName: userData ? userData.owner_name : ownerName,
        ownerPhone: userData ? userData.owner_phone : ownerPhone,
        signatureData,
      };

      console.log('📤 Sending contract data:', requestData);

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Show success modal instead of resetting form
        setSuccessData({
          contractId: responseData.contractId,
          lotNumber: lotNumber.toUpperCase(),
          fullName: userData ? userData.full_name : fullName
        });
        setShowSuccessModal(true);
        setIsLoading(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.log('❌ Server error response:', errorData);
        setMessage(errorData.error || 'Error en el servidor');
        setMessageType('error');
      }
    } catch {
      setMessage('Error al procesar el contrato. Por favor, intente nuevamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLotAvailability = async (lot: string) => {
    if (lot.length !== 8) return;
    
    try {
      const response = await fetch(`/api/check-lot/${encodeURIComponent(lot)}`);
      const data = await response.json();
      
      if (data.available) {
        setLotCheckMessage('✓ Número de lote disponible');
        setLotCheckType('success');
      } else {
        setLotCheckMessage('✗ Este número de lote ya ha sido registrado');
        setLotCheckType('error');
      }
    } catch {
      setLotCheckMessage('');
      setLotCheckType('');
    }
  };

  const resetForm = () => {
    setCountryCode('+1');
    setPhoneNumber('');
    setFullName('');
    setAddress('');
    setGatepass('');
    setLotNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setPhoneVerified(false);
    setUserData(null);
    setShowSuccessModal(false);
    setSuccessData(null);
    setMessage('');
    setMessageType('');
    setLotCheckMessage('');
    setLotCheckType('');
    clearSignature();
  };

  const resetForNewVehicle = () => {
    setGatepass('');
    setLotNumber('');
    setShowSuccessModal(false);
    setSuccessData(null);
    setMessage('');
    setMessageType('');
    setLotCheckMessage('');
    setLotCheckType('');
    clearSignature();
  };

  const currentDate = new Date().toLocaleDateString('es-ES');
  const displayName = userData ? userData.full_name : (fullName || '[NOMBRE COMPLETO]');
  const displayLot = lotNumber || '[NÚMERO DE LOTE]';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-3 sm:p-4" style={{touchAction: 'manipulation'}}>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 lg:p-8 mx-3 sm:mx-4" style={{maxWidth: '100vw', boxSizing: 'border-box'}}>
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-2 leading-tight px-2">
            Contrato de Levantamiento de Vehículo
          </h1>
          <div className="text-base sm:text-lg lg:text-xl font-semibold text-red-600 mb-2 px-2">
            Jorge Minnesota Logistics LLC
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Phone Number Field */}
          <div className="mb-4 sm:mb-6">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={phoneVerified}
                className="w-full sm:w-auto px-3 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 bg-white text-base font-medium" style={{minHeight: '48px', fontSize: '16px'}}
              >
                <option value="+1">🇺🇸 +1 (EE.UU.)</option>
                <option value="+52">🇲🇽 +52 (México)</option>
              </select>
              
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  if (formatted.replace(/\D/g, '').length <= 10) {
                    setPhoneNumber(formatted);
                  }
                }}
                disabled={phoneVerified}
                className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 text-base font-medium"
                placeholder="(555) 123-4567"
                maxLength={14}
                style={{minHeight: '48px', fontSize: '16px'}}
                required
              />
              
              <button
                type="button"
                onClick={checkPhone}
                disabled={phoneVerified || isLoading || phoneNumber.replace(/\D/g, '').length !== 10}
                className={`w-full sm:w-auto px-4 sm:px-6 py-4 text-white rounded-lg transition-colors text-base font-semibold ${
                  phoneVerified 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : phoneNumber.replace(/\D/g, '').length !== 10
                      ? 'bg-green-400 cursor-not-allowed'
                      : isLoading
                        ? 'bg-green-500'
                        : 'bg-green-500 hover:bg-green-500'
                }`}
                style={{minHeight: '48px', fontSize: '16px', touchAction: 'manipulation'}}
              >
                {isLoading ? 'Verificando...' : phoneVerified ? 'Verificado ✓' : 'Verificar'}
              </button>
            </div>
            
            {phoneNumber && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2 break-all">
                Número completo: <span className="font-mono">{getFullPhoneNumber()}</span>
              </p>
            )}
          </div>

          {/* Conditional Fields for New Users */}
          {phoneVerified && !userData && (
            <>
              <div className="mb-4 sm:mb-6">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre y Apellido:
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium"
                  placeholder="Ingrese su nombre completo"
                  style={{minHeight: '48px', fontSize: '16px'}}
                  required
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección:
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium"
                  placeholder="Ingrese su dirección completa"
                  style={{minHeight: '48px', fontSize: '16px'}}
                  required
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Dueño de la Cuenta:
                </label>
                <input
                  type="text"
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium"
                  placeholder="Ingrese el nombre del dueño de la cuenta"
                  style={{minHeight: '48px', fontSize: '16px'}}
                  required
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono del Dueño de la Cuenta:
                </label>
                <input
                  type="tel"
                  id="ownerPhone"
                  value={ownerPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    if (formatted.replace(/\D/g, '').length <= 10) {
                      setOwnerPhone(formatted);
                    }
                  }}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium"
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  style={{minHeight: '48px', fontSize: '16px'}}
                  required
                />
              </div>

            </>
          )}

          {/* Lot Number Field */}
          {phoneVerified && (
            <div className="mb-4 sm:mb-6">
              <label htmlFor="lotNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Lote (8 dígitos):
              </label>
              <input
                type="text"
                id="lotNumber"
                value={lotNumber}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setLotNumber(value);
                  if (value.length === 8) {
                    checkLotAvailability(value);
                  } else {
                    setLotCheckMessage('');
                    setLotCheckType('');
                  }
                }}
                maxLength={8}
                className={`w-full px-4 py-4 border-2 rounded-lg focus:ring-2 focus:ring-red-500 text-base font-mono font-medium ${
                  lotCheckType === 'error' 
                    ? 'border-red-500 focus:border-red-500' 
                    : lotCheckType === 'success'
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:border-red-500'
                }`}
                placeholder="Ejemplo: ABC12345"
                style={{minHeight: '48px', fontSize: '16px'}}
                required
              />
              {lotCheckMessage && (
                <p className={`text-xs sm:text-sm mt-2 ${
                  lotCheckType === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lotCheckMessage}
                </p>
              )}
            </div>
          )}

          {/* Gatepass Field */}
          {phoneVerified && (
            <div className="mb-4 sm:mb-6">
              <label htmlFor="gatepass" className="block text-sm font-medium text-gray-700 mb-2">
                Gatepass (máximo 6 caracteres):
              </label>
              <input
                type="text"
                id="gatepass"
                value={gatepass}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Solo permitir letras y números, máximo 6 caracteres
                  if (/^[A-Z0-9]*$/.test(value) && value.length <= 6) {
                    setGatepass(value);
                  }
                }}
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-mono font-medium"
                placeholder="Ejemplo: ABC123"
                style={{minHeight: '48px', fontSize: '16px'}}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras y números, máximo 6 caracteres ({gatepass.length}/6)
              </p>
            </div>
          )}

          {/* Contract Text */}
          {phoneVerified && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border-l-4 border-red-600" style={{lineHeight: '1.6'}}>
              <p className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">CONTRATO DE AUTORIZACIÓN DE LEVANTAMIENTO</p>
              <p className="mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base" style={{fontSize: '15px', lineHeight: '1.5'}}>
                Yo, <span className="font-semibold text-red-600">{displayName}</span>, el abajo firmante, 
                <strong> ACEPTO Y RECONOZCO</strong> que el vehículo correspondiente al lote número{' '}
                <span className="font-mono font-bold text-red-600 break-all">{displayLot}</span> es de mi 
                propiedad y que entiendo que al término de 3 dias que el vehículo este en la posesion de Jorge Minnesota Logistics LLC empezara a acumular cargos de almacenamiento, en caso de no ser pagado o retirado de las instalaciones.
              </p>
              <p className="mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                En dado caso de que no se retire despues de 3 meses de que empiezen los cargos illustrados arriba, se tomaran otras medidas legales.
              </p>
              <p className="mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                Esta declaración es otorgada de manera voluntaria y con pleno conocimiento de las consecuencias 
                de esta acción.
              </p>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                Fecha: <span className="font-semibold">{currentDate}</span>
              </p>
              <p className="font-bold text-red-600 text-sm sm:text-base">Jorge Minnesota Logistics LLC</p>
            </div>
          )}

          {/* Signature Section */}
          {phoneVerified && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 border-2 border-dashed border-red-300 rounded-lg bg-gray-50">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Firma Digital:</p>
                <p className="text-xs text-gray-500">Dibuje su firma en el área de abajo</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border-2 border-gray-400 rounded-lg cursor-crosshair bg-white touch-none w-full max-w-full"
                  style={{ 
                    width: '100%', 
                    maxWidth: '600px', 
                    height: 'auto',
                    minHeight: '200px',
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-base font-semibold"
                  style={{minHeight: '48px', fontSize: '16px', touchAction: 'manipulation'}}
                >
                  Limpiar Firma
                </button>
                {hasSignature && (
                  <p className="text-xs text-green-600 mt-2">Firma capturada ✓</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {phoneVerified && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-red-600 text-white text-lg font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              style={{minHeight: '56px', fontSize: '18px', touchAction: 'manipulation'}}
            >
              {isLoading ? 'Procesando...' : 'ACEPTAR Y FIRMAR CONTRATO'}
            </button>
          )}


          {/* Message Display */}
          {message && (
            <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg text-center text-sm sm:text-base ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 sm:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                ¡Registro Exitoso!
              </h2>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                El contrato ha sido firmado y guardado correctamente.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13h10M7 13l-1.5 6m9.5-6v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <p className="text-xs sm:text-sm text-gray-600 break-all"><strong>Cliente:</strong> {successData.fullName}</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 break-all"><strong>Lote:</strong> {successData.lotNumber}</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Su vehículo ha sido verificado exitosamente.
              </p>
              
              <button
                onClick={resetForNewVehicle}
                className="w-full py-4 bg-black text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-base"
                style={{minHeight: '48px', fontSize: '16px', touchAction: 'manipulation'}}
              >
                Registrar Otro Vehículo
              </button>
              
              <button
                onClick={resetForm}
                className="w-full py-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors text-base"
                style={{minHeight: '48px', fontSize: '16px', touchAction: 'manipulation'}}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}