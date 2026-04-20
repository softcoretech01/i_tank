import React from 'react';
import { X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import TankFormTabs from './TankFormTabs';
import TankDetailsTab from './TankDetailsTab';
import TankCertificateTab from './TankCertificateTab';
import TankDrawingsTab from './TankDrawingsTab';
import TankValveTab from './TankValveTab';
import TankGaugeTab from './TankGaugeTab';
import TankframeAndOuterShellTab from './Tankframe&outershelltab';
import TankOtherImagesTab from './TankOtherImagesTab';

export default function AddTankModal({ show, onClose, onSaveSuccess, tankId, tanks }) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Controlled by URL now
    const activeTab = searchParams.get('tab') || 'tank';

    // tankId prop comes from URL in parent, so we use it directly
    const currentTankId = tankId;

    if (!show) return null;

    const isEditMode = !!currentTankId;
    const title = isEditMode ? 'Edit Tank' : 'Add New Tank';

    const tabOrder = ['tank', 'certificate', 'drawing', 'valve', 'gauge', 'tank_frame', 'others'];

    // Update URL to change tab (Pushes to History)
    const handleTabChange = (tab) => {
        if (!currentTankId && tab !== 'tank') {
            alert('Please save the "Tank Basic Details" first before navigating to other tabs.');
            return;
        }

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', tab);
            return newParams;
        }, { replace: false });
    };

    // Robust Next Step Handler
    const handleNextStep = (incomingData) => {
        let newId = null;

        // 1. Check if it is a valid ID (Number or String)
        if (incomingData && (typeof incomingData === 'number' || typeof incomingData === 'string')) {
            newId = incomingData;
        }
        // 2. Check if it is an API Object
        else if (incomingData && typeof incomingData === 'object') {
            const isEvent = typeof incomingData.preventDefault === 'function';
            if (!isEvent) {
                newId = incomingData.id || incomingData.data?.id || incomingData.tank_id;
            }
        }

        // 3. Switch Tab (and update ID if new)
        const currentIndex = tabOrder.indexOf(activeTab);

        if (currentIndex < tabOrder.length - 1) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                // Update ID if we have a new one (e.g. just created tank)
                if (newId) newParams.set('id', newId);

                // Set next tab
                newParams.set('tab', tabOrder[currentIndex + 1]);
                return newParams;
            }, { replace: false }); // Navigate forward
        } else {
            // Last tab: Close and Refresh
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-[1200px] h-[calc(100%-2rem)] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#54737E] text-white rounded-t-lg">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="px-6 pt-5 pb-3">
                    <TankFormTabs activeTab={activeTab} setActiveTab={handleTabChange} />
                </div>

                {/* Content Area */}
                <div className="flex-grow px-8 pb-6 overflow-y-auto">

                    {activeTab === 'tank' && (
                        <TankDetailsTab
                            onClose={onClose}
                            onSaveSuccess={handleNextStep}
                            tankId={currentTankId}
                            existingTanks={tanks}
                        />
                    )}

                    {activeTab === 'certificate' && (
                        <TankCertificateTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}

                    {activeTab === 'drawing' && (
                        <TankDrawingsTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}

                    {activeTab === 'valve' && (
                        <TankValveTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}

                    {activeTab === 'gauge' && (
                        <TankGaugeTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}

                    {activeTab === 'tank_frame' && (
                        <TankframeAndOuterShellTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}

                    {activeTab === 'others' && (
                        <TankOtherImagesTab
                            tankId={currentTankId}
                            onClose={onClose}
                            onNext={handleNextStep}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}