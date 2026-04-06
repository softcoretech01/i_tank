import React from 'react';

// We must use "export const" for a named export
export const Checkbox = ({ label, id, checked, onChange, disabled = false }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
      <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  );
};