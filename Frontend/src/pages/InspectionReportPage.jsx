import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { LayoutList, Camera, ClipboardCheck, ListTodo, Eye, ArrowLeft } from 'lucide-react';
import { getActiveTanks, getInspectionMasters, getInspectionReview } from '../services/inspectionService';
import TankInfoTab from '../components/inspection/TankInfoTab';
import UploadPhotosTab from '../components/inspection/UploadPhotosTab';
import ChecklistTab from '../components/inspection/ChecklistTab';
import ToDoListTab from '../components/inspection/ToDoListTab';
import ReviewTab from '../components/inspection/ReviewTab';
import InspectionListTab from '../components/inspection/InspectionListTab';

const tabs = [
    { key: 'tankInfo', label: 'Tank Info', icon: LayoutList },
    { key: 'uploadPhotos', label: 'Upload Photos', icon: Camera },
    { key: 'checklist', label: 'Checklist', icon: ClipboardCheck },
    { key: 'todo', label: 'To-do List', icon: ListTodo },
    { key: 'review', label: 'Review & Submit', icon: Eye },
];

function InspectionListWrapper() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col bg-gray-50 font-sans p-4 min-w-max min-h-max">
            <InspectionListTab
                onAddClick={() => navigate('new')}
                onEditClick={(item) => navigate(`edit/${item.inspection_id}`, { state: { tankId: item.tank_id } })}
                onViewClick={(item) => navigate(`view/${item.inspection_id}`, { state: { tankId: item.tank_id } })}
                onHistoryClick={(item) => navigate(`view/${item.inspection_id}`, { state: { tankId: item.tank_id } })}
            />
        </div>
    );
}

function InspectionWizard({ mode }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const activeTab = searchParams.get('tab') || 'tankInfo';
    const inspectionId = id ? parseInt(id) : null;
    const isViewMode = mode === 'VIEW';

    // State
    const [tankId, setTankId] = useState(location.state?.tankId || '');
    const [hasFaulty, setHasFaulty] = useState(false);
    const [isTodoSaved, setIsTodoSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [masters, setMasters] = useState({});
    const [activeTanks, setActiveTanks] = useState([]);

    // Set Active Tab Helper
    const setActiveTab = (tabKey) => {
        // Use push (replace: false) so that tab changes are recorded in history
        setSearchParams({ tab: tabKey });
    };

    // Load Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mastersData, tanksData] = await Promise.all([
                    getInspectionMasters(),
                    getActiveTanks()
                ]);
                setMasters(mastersData.data || {});
                setActiveTanks(tanksData.data?.active_tanks || []);

                // If we have an ID but no tankId (e.g. reload or direct link), fetch it
                if (inspectionId && !tankId) {
                    try {
                        const reviewData = await getInspectionReview(inspectionId);
                        if (reviewData?.data?.inspection?.tank_id) {
                            setTankId(reviewData.data.inspection.tank_id);
                        }
                    } catch (e) {
                        console.error("Failed to fetch inspection details", e);
                    }
                }
            } catch (err) {
                console.error("Error fetching initial data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [inspectionId, tankId]); // Added tankId dep to prevent overly repetitive fetching if handled, but logic guards it. 

    // Back Arrow: Navigate back to the list screen
    const handleBackHistory = () => {
        navigate('/inspection');
    };

    // Success/Done: Explicitly go to list (reset flow)
    const handleFormDone = () => {
        navigate('/inspection');
    };

    const handleInspectionCreated = (newId, newTankId) => {
        // Navigate within the current mode's path (new or edit)
        const pathPrefix = mode === 'ADD' ? 'new' : 'edit';
        navigate(`/inspection/${pathPrefix}/${newId}?tab=uploadPhotos`, { replace: true, state: { tankId: newTankId } });
        setTankId(newTankId);
    };

    const visibleTabs = tabs.filter(tab => {
        if (tab.key === 'todo') return hasFaulty;
        return true;
    });

    const renderWizardContent = () => {
        switch (activeTab) {
            case 'tankInfo':
                return (
                    <TankInfoTab
                        masters={masters}
                        activeTanks={activeTanks}
                        onSuccess={handleInspectionCreated}
                        inspectionId={inspectionId}
                        mode={mode}
                    />
                );
            case 'uploadPhotos':
                return <UploadPhotosTab inspectionId={inspectionId} onNext={() => setActiveTab('checklist')} mode={mode} />;
            case 'checklist':
                return (
                    <ChecklistTab
                        inspectionId={inspectionId}
                        tankId={tankId}
                        onFaultyDetected={(faulty) => {
                            setHasFaulty(faulty);
                            if (faulty) setIsTodoSaved(false);
                        }}
                        onNext={(isFaulty) => {
                            setActiveTab(isFaulty ? 'todo' : 'review');
                        }}
                        mode={mode}
                    />
                );
            case 'todo':
                return (
                    <ToDoListTab
                        inspectionId={inspectionId}
                        onNext={() => {
                            setIsTodoSaved(true);
                            setActiveTab('review');
                        }}
                        mode={mode}
                    />
                );
            case 'review':
                // For View Mode, we typically just show review tab, but original code used ReviewTab for both
                return <ReviewTab inspectionId={inspectionId} onSubmitSuccess={handleFormDone} readOnly={isViewMode} mode={mode} />;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading initial data...</div>;

    // View Mode Override: Just show ReviewTab content wrapped in layout?
    // Original code showed ReviewTab inside the layout for VIEW mode (different container style).
    // Let's preserve that logic.

    if (isViewMode) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
                <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={handleBackHistory} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h1 className="text-lg font-black text-[#546E7A] uppercase tracking-tight">View Report</h1>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden flex flex-col p-2">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-8">
                            <ReviewTab inspectionId={inspectionId} readOnly={true} onSubmitSuccess={handleFormDone} />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBackHistory}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h1 className="text-lg font-black text-[#546E7A] uppercase tracking-tight">
                        {mode === 'ADD' ? 'New Report' : 'Edit Report'}
                    </h1>
                </div>
            </header>

            {/* Tabs Layout */}
            <main className="flex-1 overflow-hidden flex flex-col p-2">
                <div className="flex flex-col h-full">
                    {/* Custom Step Indicator (Tabs) */}
                    <div className="flex items-center justify-center mb-4 relative py-2">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 -z-10 mx-20"></div>
                        {visibleTabs.map((tab, index) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            const isPast = visibleTabs.findIndex(t => t.key === activeTab) > index;

                            // Determine if tab is clickable/disabled
                            // TankInfo always enabled
                            // Others disabled if no inspectionId (New mode)
                            const isDisabled = (!inspectionId && tab.key !== 'tankInfo') ||
                                (tab.key === 'review' && hasFaulty && !isTodoSaved) ||
                                (tab.key === 'todo' && !hasFaulty);

                            return (
                                <div key={tab.key} className="flex flex-col items-center mx-4 md:mx-10 relative">
                                    <button
                                        disabled={isDisabled}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`
                                            w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                            ${isActive
                                                ? 'bg-[#48BB78] border-[#48BB78] text-white shadow-lg scale-110'
                                                : isPast
                                                    ? 'bg-[#48BB78] border-[#48BB78] text-white hover:bg-[#3da366] cursor-pointer'
                                                    : isDisabled
                                                        ? 'bg-white border-gray-200 text-gray-300 cursor-not-allowed opacity-60'
                                                        : 'bg-white border-[#546E7A]/40 text-[#546E7A] hover:border-[#546E7A] hover:bg-gray-50 cursor-pointer shadow-sm'}
                                        `}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                    <span className={`mt-2 text-[10px] font-bold whitespace-nowrap uppercase tracking-wider ${isActive ? 'text-[#546E7A]' : isDisabled ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {tab.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tab Content Paper */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-50 flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {renderWizardContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function InspectionReportPage() {
    return (
        <Routes>
            <Route index element={<InspectionListWrapper />} />
            <Route path="new/:id?" element={<InspectionWizard mode="ADD" />} />
            <Route path="edit/:id" element={<InspectionWizard mode="EDIT" />} />
            <Route path="view/:id" element={<InspectionWizard mode="VIEW" />} />
        </Routes>
    );
}
