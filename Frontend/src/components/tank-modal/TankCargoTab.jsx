import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormSelect } from '../ui/FormSelect';
import { FormInput } from '../ui/FormInput';
import { 
  getMasterCargos, 
  getTankCargos, 
  addTankCargo, 
  deleteTankCargo 
} from '../../services/cargoService';

export default function TankCargoTab({ tankId, onNext }) {
  const [masterList, setMasterList] = useState([]);
  const [linkedCargos, setLinkedCargos] = useState([]);
  
  // Form State
  const [selectedCargoId, setSelectedCargoId] = useState('');
  
  // States for new fields based on the model
  const [density, setDensity] = useState('');
  const [compatibilityNotes, setCompatibilityNotes] = useState('');
  const [loadingParts, setLoadingParts] = useState(''); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Show warning if tank isn't saved
  if (!tankId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
        <AlertCircle className="w-12 h-12 text-orange-500" />
        <p className="text-lg font-medium">Please save the "Tank Basic Details" first.</p>
        <p className="text-sm">You need a created tank before you can link cargo to it.</p>
      </div>
    );
  }

  // Fetch Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [masters, linked] = await Promise.all([
        getMasterCargos(),
        getTankCargos(tankId)
      ]);
      setMasterList(masters);
      setLinkedCargos(linked);
    } catch (err) {
      setError('Failed to load cargo data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tankId) loadData();
  }, [tankId]);

  // Handle Adding a Cargo Link
  const handleAdd = async () => {
    if (!selectedCargoId) return alert('Please select a cargo type.');
    
    try {
      const payload = {
        tank_id: tankId,
        cargo_master_id: parseInt(selectedCargoId),
        density: density,
        compatability_notes: compatibilityNotes, 
        loading_parts: loadingParts, 
        created_by: "Admin"
      };
      
      await addTankCargo(payload);
      
      // Reset form 
      setSelectedCargoId('');
      setDensity('');
      setCompatibilityNotes('');
      setLoadingParts('');
      
      // Reload list
      await loadData();

      // --- WIZARD FLOW: Move to Next Tab ---
      if (onNext) {
        onNext();
      }

    } catch (err) {
      alert('Failed to add cargo. It might already be linked or data is invalid.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Remove this cargo?')) {
      try {
        await deleteTankCargo(id);
        loadData();
      } catch (err) {
        alert('Failed to delete cargo link.');
      }
    }
  };

  return (
    <div className="space-y-8">

      {/* --- Section 1: Add New Cargo Form --- */}
      <div className="p-4 space-y-4"> 
        
        {/* Row 1: Cargo Type, Density, Compatibility Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <FormSelect 
            label="Cargo Type" 
            id="cargo_select" 
            value={selectedCargoId} 
            onChange={(e) => setSelectedCargoId(e.target.value)}
          >
            <option value="">-- Select Cargo --</option>
            {masterList.map(c => (
              <option key={c.id} value={c.id}>{c.cargo_reference}</option>
            ))}
          </FormSelect>

          <FormInput 
            label="Density" 
            id="density" 
            value={density} 
            onChange={(e) => setDensity(e.target.value)} 
            placeholder="e.g. 1.8 kg/m³"
          />

          <FormInput 
            label="Compatibility Notes" 
            id="compatibility_notes" 
            value={compatibilityNotes} 
            onChange={(e) => setCompatibilityNotes(e.target.value)} 
            placeholder="e.g. Requires Teflon Gaskets"
          />
        </div>

        {/* Row 2: Loading Port & Add Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <FormInput 
            label="Loading Port" 
            id="loading_parts" 
            value={loadingParts} 
            onChange={(e) => setLoadingParts(e.target.value)} 
            placeholder="e.g. Pump, Valve 1"
          />
          
          <div className="md:col-span-2 pb-1 flex justify-end">
            <Button 
              onClick={handleAdd} 
              variant="primary" 
              icon={Plus}
              // Updated to match the Slate Blue theme of the Wizard
              className="bg-[#54737E] hover:bg-[#47656e] text-white w-full md:w-auto py-2.5 rounded-lg shadow-md font-normal"
            >
              Add Cargo
            </Button>
          </div>
        </div>
      </div>

      {/* --- Section 2: List of Linked Cargo (Table) --- */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Cargo References List</h4>
        
        {error && <p className="text-red-500">{error}</p>}
        
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full min-w-full divide-y divide-gray-200">
            {/* Updated Header to match Slate Blue theme */}
            <thead className="bg-[#54737E] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Cargo Reference</th>
                <th className-="px-6 py-3 text-left text-xs font-medium uppercase">Density</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Compatibility Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Loading Parts</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linkedCargos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No cargo linked yet.
                  </td>
                </tr>
              ) : (
                linkedCargos.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.cargo_reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.density || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.compatability_notes}>
                      {item.compatability_notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.loading_parts || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <Button 
                        onClick={() => handleDelete(item.id)} 
                        variant="danger" 
                        size="sm" 
                        icon={Trash2} 
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}