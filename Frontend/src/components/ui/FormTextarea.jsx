import React from 'react';

export default function FormTextarea({ label, id, value, onChange, rows = 3, placeholder, required = false, error }) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                rows={rows}
                placeholder={placeholder}
                required={required}
                className={`mt-1 block w-full rounded-md border ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm p-2 text-gray-900 resize-y`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}