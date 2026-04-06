import React from 'react';
import { Check } from 'lucide-react';

export const MultiSelect = ({
    options = [],
    value = [],
    onChange,
    className = "",
    placeholder = "No options available",
    height = "h-40"
}) => {
    // options: Array of { label: string, value: string|number }
    // value: Array of strings|numbers (selected values)
    // onChange: (newValue: Array) => void

    const toggleOption = (optionValue) => {
        // Ensure value is an array
        const currentValues = Array.isArray(value) ? value : [];
        const index = currentValues.indexOf(optionValue);

        let newValues;
        if (index === -1) {
            newValues = [...currentValues, optionValue];
        } else {
            newValues = [...currentValues];
            newValues.splice(index, 1);
        }

        // Return just the values, similar to what a select would produce conceptually
        onChange(newValues);
    };

    return (
        <div className={`overflow-y-auto border border-gray-300 rounded-md bg-white shadow-sm ${height} ${className}`}>
            {options.length > 0 ? (
                options.map((opt) => {
                    // Loose equality check might be needed if mixing strings/numbers, 
                    // but best to rely on strict if possible. 
                    // However, select values are often strings.
                    const isSelected = (value || []).includes(opt.value);
                    return (
                        <div
                            key={opt.value}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm select-none transition-colors border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            onClick={() => toggleOption(opt.value)}
                        >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                    );
                })
            ) : (
                <div className="px-3 py-2 text-sm text-gray-400 italic text-center mt-4">
                    {placeholder}
                </div>
            )}
        </div>
    );
};
