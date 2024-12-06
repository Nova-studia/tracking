import React, { useState, useEffect, useRef } from 'react';

const ClientAutocomplete = ({ clients, value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef(null);
  const selectedClient = clients.find(c => c._id === value);

  useEffect(() => {
    if (selectedClient) {
      setInputValue(selectedClient.name);
      setSuggestion('');
    }
  }, [selectedClient]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    if (text) {
      const match = clients.find(client =>
        client.name.toLowerCase().startsWith(text.toLowerCase())
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
      const client = clients.find(c => c.name.toLowerCase() === suggestion.toLowerCase());
      if (client) {
        onChange(client._id);
        setInputValue(suggestion);
        setSuggestion('');
      }
    }
  };

  const getSuggestionDisplay = () => {
    if (!suggestion || !inputValue) return '';
    const boldPart = suggestion.slice(inputValue.length);
    return boldPart;
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
        placeholder="Buscar cliente..."
        autoComplete="off"
      />
      {suggestion && suggestion !== inputValue && (
        <div className="absolute left-0 top-0 px-2 py-1 pointer-events-none text-sm">
          <span className="text-slate-900">{inputValue}</span>
          <span className="text-slate-400 font-bold">{getSuggestionDisplay()}</span>
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete;