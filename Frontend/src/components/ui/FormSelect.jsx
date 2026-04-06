import React from 'react';
import { ChevronDown } from 'lucide-react';

export const FormSelect = ({ label, id, value, onChange, children, error = null, required = false }) => {
  const borderColor = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-2 pr-10 text-gray-700 bg-white border rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:border-transparent ${borderColor}`}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute w-5 h-5 text-gray-400 pointer-events-none"
          style={{ top: '50%', right: '0.75rem', transform: 'translateY(-50%)' }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};