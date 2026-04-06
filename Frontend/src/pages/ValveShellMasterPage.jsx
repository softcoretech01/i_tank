import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit, Eye, Search, RotateCcw,
  FileSpreadsheet, Save, ArrowLeft, Upload, X, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getAllValveShell,
  createValveShell,
  updateValveShell
} from '../services/valveShellService';
import { getTanks } from '../services/tankService';

// Unwrap UniformResponseMiddleware envelope: {success, data, message} → data
const unwrap = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data;
  }
  return response;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const IMAGE_SLOTS = [
  { field: 'valve_label', dataField: 'valve_label_image_path', nameField: 'valve_label_image_name', label: 'Valve Label Image', color: 'blue' },
  { field: 'tank_frame', dataField: 'tank_frame_image_path', nameField: 'tank_frame_image_name', label: 'Tank Frame/Outer Shell Image', color: 'indigo' },
];

const colorBorder = {
  blue: 'hover:border-blue-400 hover:bg-blue-50',
  indigo: 'hover:border-indigo-400 hover:bg-indigo-50',
};
const colorIcon = {
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
};

// ---- Status Toggle ----
const StatusToggle = ({ active, onToggle }) => (
  <button
    onClick={onToggle}
    title={active ? 'Active – click to deactivate' : 'Inactive – click to activate'}
    className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${active ? 'translate-x-7' : 'translate-x-1'}`} />
  </button>
);

export default function ValveShellMasterPage({ mode = 'list' }) {
  const navigate = useNavigate();
  const { id: editingId } = useParams();

  // --- List State ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [searchBy, setSearchBy] = useState('tank_number');

  // --- Form State ---
  const [tanks, setTanks] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = {
    tank_id: '',
    valve_label: null,
    tank_frame: null,
    valve_label_removed: false,
    tank_frame_removed: false,
  };
  const [formData, setFormData] = useState(emptyForm);

  // --- Load data ---
  useEffect(() => {
    if (mode === 'list') {
      fetchRecords();
    } else {
      fetchTanks();
      if (mode === 'edit' && editingId) loadEditingData(editingId);
    }
  }, [mode, editingId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getAllValveShell();
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTanks = async () => {
    try {
      const raw = await getTanks();
      const data = unwrap(raw);
      const list = Array.isArray(data) ? data : [];
      setTanks(list.filter(t => t.status === 1));
    } catch (err) {
      console.error('Failed to fetch tanks:', err);
    }
  };

  const loadEditingData = async (id) => {
    try {
      const all = await getAllValveShell();
      const list = Array.isArray(all) ? all : (all?.data || []);
      const item = list.find(r => String(r.id) === String(id));
      if (item) {
        setExistingData(item);
        setFormData({
          tank_id: item.tank_id,
          valve_label: null,
          tank_frame: null,
          valve_label_removed: false,
          tank_frame_removed: false,
        });
      }
    } catch (err) {
      console.error('Failed to load editing data:', err);
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterTerm) return items;
    return items.filter(item => String(item[searchBy] || '').toLowerCase().includes(filterTerm.toLowerCase()));
  }, [items, filterTerm, searchBy]);

  const handleSearch = () => setFilterTerm(searchTerm);
  const handleShowAll = () => { setSearchTerm(''); setFilterTerm(''); };

  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(`Only image files are allowed.`);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size must not exceed 2 MB. Selected: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (mode !== 'edit' && !formData.tank_id) {
      alert('Please select a Tank');
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      if (mode !== 'edit') fd.append('tank_id', formData.tank_id);
      
      if (formData.valve_label) fd.append('valve_label_file', formData.valve_label);
      if (formData.tank_frame) fd.append('tank_frame_file', formData.tank_frame);

      if (mode === 'edit' && editingId) {
        if (formData.valve_label_removed && !formData.valve_label) fd.append('clear_valve_label', '1');
        if (formData.tank_frame_removed && !formData.tank_frame) fd.append('clear_tank_frame', '1');
        
        await updateValveShell(editingId, fd);
        alert('Record updated successfully');
      } else {
        await createValveShell(fd);
        alert('Record added successfully');
      }
      navigate('/masters/valve-shell');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save record: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 1 ? 0 : 1;
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await updateValveShell(item.id, fd);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Status toggle failed:', err);
      alert('Failed to update status');
    }
  };

  const ImageUploadCard = ({ slot }) => {
    const file = formData[slot.field];
    const existingUrl = existingData ? existingData[slot.dataField] : null;
    const removedKey = `${slot.field}_removed`;
    const isRemoved = formData[removedKey] === true;
    const hasExisting = !!existingUrl && !isRemoved;
    const previewUrl = file ? URL.createObjectURL(file) : (hasExisting ? existingUrl : null);

    return (
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <div className="flex justify-between items-center px-1">
          <label className="text-sm font-bold text-gray-700">{slot.label}</label>
          <span className="text-[10px] text-gray-400 italic">Image · Max 2 MB</span>
        </div>
        {previewUrl ? (
          <div className="relative group border-2 border-green-200 rounded-xl overflow-hidden bg-gray-50 h-40">
            <img src={previewUrl} alt={slot.label} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
              </a>
              <button 
                type="button" 
                onClick={() => {
                   if (file) setFormData(p => ({ ...p, [slot.field]: null }));
                   else setFormData(p => ({ ...p, [removedKey]: true }));
                }}
                className="p-2 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all`}>
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <span className="text-xs text-gray-500">Upload Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, slot.field)} />
          </label>
        )}
        {previewUrl && (
          <label className="flex items-center justify-center gap-1 cursor-pointer text-[10px] text-gray-400 hover:text-green-500 font-semibold py-1">
             <Upload className="w-3 h-3" /> Replace Image
             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, slot.field)} />
          </label>
        )}
      </div>
    );
  };

  if (mode === 'list') {
    return (
      <div className="flex flex-col flex-1 p-4 bg-gray-50 h-screen overflow-hidden">
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
             <h1 className="text-2xl font-bold text-[#546E7A]">Valve & Shell Master</h1>
             <Button onClick={() => navigate('/masters/valve-shell/add')} variant="primary" icon={Plus} className="bg-[#2E7D32] hover:bg-[#1B5E20] px-6">
                Add Record
             </Button>
          </div>
          <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-4">
             <span className="text-gray-700 font-semibold text-sm uppercase">Search by</span>
             <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} className="h-10 px-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none bg-white min-w-[160px] text-sm font-medium">
                <option value="tank_number">Tank Number</option>
             </select>
             <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-10 w-full pl-9 pr-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none text-sm" />
             </div>
             <div className="flex gap-2 font-semibold">
                <Button onClick={handleSearch} icon={Search} className="bg-[#455A64] hover:bg-[#37474F]">Search</Button>
                <Button onClick={handleShowAll} icon={RotateCcw} className="bg-[#455A64] hover:bg-[#37474F]">Reset</Button>
             </div>
          </div>
          <div className="flex-1 overflow-auto">
             <table className="w-full">
                <thead className="sticky top-0 bg-[#455A64] text-white z-10">
                   <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Tank Number</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Valve Image</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Frame Image</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider w-32">Actions</th>
                   </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                   {loading ? (
                      <tr><td colSpan="5" className="py-10 text-center text-gray-400 italic font-medium">Loading records...</td></tr>
                   ) : filteredItems.length === 0 ? (
                      <tr><td colSpan="5" className="py-10 text-center text-gray-400 italic font-medium">No records found.</td></tr>
                   ) : (
                      filteredItems.map(item => (
                         <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.id}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.tank_number}</td>
                            <td className="px-6 py-4 text-center">
                               {item.valve_label_image_path ? <Eye onClick={() => window.open(item.valve_label_image_path, '_blank')} className="w-5 h-5 text-blue-500 mx-auto cursor-pointer" /> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {item.tank_frame_image_path ? <Eye onClick={() => window.open(item.tank_frame_image_path, '_blank')} className="w-5 h-5 text-blue-500 mx-auto cursor-pointer" /> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2 items-center">
                                  <button onClick={() => navigate(`/masters/valve-shell/edit/${item.id}`)} className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit className="w-5 h-5" /></button>
                                  <StatusToggle active={item.status === 1} onToggle={() => handleToggleStatus(item)} />
                               </div>
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

  return (
    <div className="flex flex-col flex-1 p-4 bg-gray-100 h-screen overflow-auto">
      <div className="max-w-4xl mx-auto w-full flex flex-col space-y-4">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <button onClick={() => navigate('/masters/valve-shell')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-[#546E7A]" /></button>
          <h1 className="text-2xl font-bold text-[#546E7A]">{mode === 'edit' ? 'Edit Record' : 'Add Valve & Shell Info'}</h1>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
           <form onSubmit={handleSave} className="space-y-8">
              <div className="max-w-md">
                 <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tank Number <span className="text-red-500">*</span></label>
                 <select value={formData.tank_id} onChange={(e) => setFormData(p => ({ ...p, tank_id: e.target.value }))} className="mt-2 w-full h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none font-medium" disabled={mode === 'edit'}>
                    <option value="">-- Select Tank --</option>
                    {tanks.map(t => <option key={t.id} value={t.id}>{t.tank_number}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                 {IMAGE_SLOTS.map(slot => <ImageUploadCard key={slot.field} slot={slot} />)}
              </div>
              <div className="flex gap-4 justify-end pt-8 border-t border-gray-100">
                 <button type="button" onClick={() => navigate('/masters/valve-shell')} className="px-10 h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold transition-all shadow-sm">Cancel</button>
                 <button type="submit" disabled={isSaving} className="px-10 h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50">
                    <Save className="w-5 h-5" /> {isSaving ? 'Saving...' : 'Save Record'}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
