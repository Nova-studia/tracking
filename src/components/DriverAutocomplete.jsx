import React, { useState, useEffect, useRef } from 'react';

const DriverAutocomplete = ({ drivers, value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef(null);
  
  const selectedDriver = drivers.find(d => d._id === value);

  useEffect(() => {
    if (selectedDriver) {
      setInputValue(selectedDriver.name);
      setSuggestion('');
    }
  }, [selectedDriver]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    if (text) {
      const match = drivers.find(driver =>
        driver.name.toLowerCase().startsWith(text.toLowerCase())
      );
      if (match) {
        setSuggestion(match.name);
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const driver = drivers.find(d => d.name.toLowerCase() === suggestion.toLowerCase());
      if (driver) {
        onChange(driver._id);
        setInputValue(suggestion);
        setSuggestion('');
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-200 text-sm"
        placeholder="Buscar driver..."
        autoComplete="off"
      />
      {suggestion && suggestion !== inputValue && (
        <div className="absolute left-0 top-0 px-2 py-1 pointer-events-none text-sm">
          <span className="text-slate-900">{inputValue}</span>
          <span className="text-slate-400 font-bold">{suggestion.slice(inputValue.length)}</span>
        </div>
      )}
    </div>
  );
};

export default DriverAutocomplete;