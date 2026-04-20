// Assuming this is the content of your TankFormTabs.jsx
import React from 'react';

const tabs = [
    { key: 'tank', label: 'Tank' },
    //{ key: 'cargo', label: 'Cargo' },//
    { key: 'certificate', label: 'Certificate' },
    { key: 'drawing', label: 'P&ID Drawings' },
    { key: 'valve', label: 'Valve' },
    { key: 'gauge', label: 'Gauge' },
    { key: 'tank_frame', label: 'Tank Frame' },
    // { key: 'others', label: 'Others' },  // Hidden tab: kept in source for future re-enable
];

export default function TankFormTabs({ activeTab, setActiveTab }) {
    return (
        // Remove border-bottom and background. The white background from the parent 
        // in AddTankModal.jsx will provide the separation/gap.
        <div className="flex w-full">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                        px-4 py-2 text-sm font-semibold transition-colors duration-150 relative
                        ${activeTab === tab.key
                            // Specific color for the active "Tank" tab, rounded top corners
                            ? 'bg-[#5D7077] text-white rounded-t-lg'
                            // Inactive tabs use the default text color (dark grey)
                            : 'text-gray-600 hover:text-gray-900'
                        }
                    `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}