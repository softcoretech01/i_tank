import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

export const SearchableSelect = ({
    label,
    id,
    value,
    onChange,
    options = [],
    placeholder = "Select...",
    className = "",
    disabled = false,
    error = null,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Find the selected option label based on the value prop
    useEffect(() => {
        const selectedOption = options.find(opt => opt.value === value);
        if (selectedOption) {
            setSearchTerm(selectedOption.label);
        } else {
            setSearchTerm('');
        }
    }, [value, options]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset search term to currently selected value's label on blur
                const selectedOption = options.find(opt => opt.value === value);
                if (selectedOption) {
                    setSearchTerm(selectedOption.label);
                } else {
                    setSearchTerm('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [value, options]);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const label = option.label || '';
        const search = searchTerm || '';
        return label.toString().toLowerCase().includes(search.toString().toLowerCase());
    });

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        // If the user clears the input, clear the selection
        if (e.target.value === '') {
            onChange({ target: { value: '' } }); // Mimic event object for consistency
        }
    };

    const handleOptionClick = (option) => {
        onChange({ target: { value: option.value } }); // Mimic event object
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(true);
        }
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange({ target: { value: '' } });
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const borderColor = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';

    return (
        <div className={`flex flex-col ${className}`} ref={wrapperRef}>
            {label && (
                <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    id={id}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onClick={handleInputClick}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full px-4 py-2 pr-10 text-gray-700 bg-white border rounded-md shadow-sm outline-none focus:ring-2 focus:border-transparent ${borderColor} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    autoComplete="off"
                />

                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center pr-2">
                    {value && !disabled && (
                        <button
                            onClick={clearSelection}
                            className="p-1 hover:text-red-500 text-gray-400 focus:outline-none"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    />
                </div>

                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${value === option.value ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-gray-500 italic">
                                No options found
                            </div>
                        )}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};
