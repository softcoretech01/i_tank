import React, { useState, useEffect } from 'react';
import { FileText, Loader, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormSelect } from '../components/ui/FormSelect';
import { getTanks } from '../services/tankService';
import { handleGeneratePPT, getInspections } from '../services/pptService';
import { SearchableSelect } from '../components/ui/SearchableSelect';

const tabs = [

  { id: 'structure', label: 'PPT Structure' },
];

export default function GeneratePPTPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState('');
  const [inspections, setInspections] = useState([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState('');
  const [activeTab, setActiveTab] = useState('structure');
  const [loading, setLoading] = useState(false);

  // --- Load Tank Data for Dropdown ---
  useEffect(() => {
    const fetchTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data);
      } catch (err) {
        console.error('Failed to load tanks');
      }
    };
    fetchTanks();
  }, []);

  // --- Load Inspections when Tank Changes ---
  useEffect(() => {
    setInspections([]);
    setSelectedInspectionId('');

    if (selectedTankId) {
      const fetchIns = async () => {
        const list = await getInspections(selectedTankId);
        setInspections(list || []);
      };
      fetchIns();
    }
  }, [selectedTankId]);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!selectedTankId) return alert("Please select a tank first.");

    setLoading(true); // Start loading spinner

    try {
      // ACTUAL API CALL HERE
      const success = await handleGeneratePPT(selectedTankId, selectedInspectionId);

      if (success) {
        console.log("PPT Generation flow completed");
      }
    } catch (error) {
      console.error("Error generating PPT:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false); // Stop loading spinner regardless of success/fail
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* ... (Rest of your UI code remains exactly the same) ... */}

      {/* --- 1. Top Header --- */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#546E7A]">
          Tank Master - Generate PPT
        </h1>
      </header>

      {/* --- 2. Tank Selection and Report Number --- */}
      <div className="px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <SearchableSelect
              label="Select Tank"
              id="tank_select"
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value)}
              options={tanks.map(tank => ({ value: tank.id, label: tank.tank_number }))}
              placeholder="-- Choose a Tank --"
            />
          </div>

          <div className="w-full md:w-1/3">
            <FormSelect
              label="Report Number"
              id="insp_select"
              value={selectedInspectionId}
              onChange={(e) => setSelectedInspectionId(e.target.value)}
              disabled={!selectedTankId || inspections.length === 0}
            >
              <option value="">-- Choose Report Number --</option>
              {inspections.map(insp => (
                <option key={insp.inspection_id} value={insp.inspection_id}>
                  {insp.report_number}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="w-full md:w-1/3 flex items-end">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[#546E7A] hover:bg-[#455A64] text-white px-6 py-2 rounded shadow-sm w-full md:w-auto"
              icon={loading ? Loader : FileText}
            >
              {loading ? 'Generating...' : 'Generate PPT'}
            </Button>
          </div>
        </div>
      </div>

      {/* --- 3. Tabs Navigation --- */}
      <div className="px-8 pt-6 border-b border-gray-200 bg-white">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium transition-all duration-200 rounded-t-md
                ${activeTab === tab.id
                  ? 'bg-[#546E7A] text-white shadow-sm'
                  : 'text-gray-500 hover:text-[#546E7A] hover:bg-gray-50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* --- 4. Main Content Area --- */}
      <main className="flex-grow p-8 overflow-auto">



        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] p-8">

          {/* --- TAB 1: Tank Photos --- */}
          {activeTab === 'photos' && (
            <div className="text-center text-gray-500 mt-10">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Upload Tank Photos</h3>
              <p className="text-sm">Select the original photos for this tank.</p>
            </div>
          )}

          {/* --- TAB 2: Cropped Photos --- */}
          {activeTab === 'cropped' && (
            <div className="text-center text-gray-500 mt-10">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Process Photos</h3>
              <p className="text-sm">Crop and adjust photos for the presentation.</p>
            </div>
          )}

          {/* --- TAB 3: PPT Structure (Matches your image) --- */}
          {activeTab === 'structure' && (
            <div className="bg-[#E2E8F0] bg-opacity-50 p-6 rounded-md border border-gray-200">
              <h3 className="text-lg font-bold text-[#2D3748] mb-3">PPT Structure</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <span className="font-medium">First 3 slides:</span> Tank Master data (Tank Number, MFGR, Date MFG, etc.)
                </li>
                <li>
                  <span className="font-medium">Next slides:</span> Each uploaded image as a slide with file name as heading
                </li>
                <li>
                  <span className="font-medium">Final slides:</span> Tank master data at the end of presentation
                </li>
              </ul>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-8 border-t border-gray-200 bg-white flex justify-end">
        <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded">Desktop 1</span>
      </footer>
    </div >
  );
}