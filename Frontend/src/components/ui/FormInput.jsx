import React from 'react';

export const FormInput = ({ label, id, name, value, onChange, placeholder, disabled = false, type = 'text', error = null, required = false, className = '' }) => {
  const borderColor = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent ${borderColor} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};