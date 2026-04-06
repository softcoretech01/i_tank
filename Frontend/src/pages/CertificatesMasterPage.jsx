import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit, Eye, Search, RotateCcw,
  FileSpreadsheet, Save, ArrowLeft, Upload, X, FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAllCertificates, createCertificate, updateCertificate } from '../services/tankCertificateService';
import { getTanks } from '../services/tankService';
import { getAllMasterData } from '../services/masterService';

// Unwrap UniformResponseMiddleware envelope: {success, data, message} → data
const unwrap = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data;
  }
  return response;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

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

const PDF_SLOTS = [
  { field: 'periodic_inspection_pdf', dataField: 'periodic_inspection_pdf_path', nameField: 'periodic_inspection_pdf_name', label: 'Periodic Inspection PDF', color: 'blue' },
  { field: 'next_insp_pdf', dataField: 'next_insp_pdf_path', nameField: 'next_insp_pdf_name', label: 'Next Inspection PDF', color: 'indigo' },
  { field: 'new_certificate_file', dataField: 'new_certificate_file', nameField: 'new_certificate_file_name', label: 'New Certificate PDF', color: 'green' },
  { field: 'old_certificate_file', dataField: 'old_certificate_file', nameField: 'old_certificate_file_name', label: 'Old Certificate PDF', color: 'amber' },
];

const colorBorder = {
  blue: 'hover:border-blue-400 hover:bg-blue-50',
  indigo: 'hover:border-indigo-400 hover:bg-indigo-50',
  green: 'hover:border-green-400 hover:bg-green-50',
  amber: 'hover:border-amber-400 hover:bg-amber-50',
};
const colorIcon = {
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
  green: 'text-green-500',
  amber: 'text-amber-400',
};

export default function CertificatesMasterPage({ mode = 'list' }) {
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
  const [agencies, setAgencies] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = {
    tank_id: '',
    certificate_number: '',
    insp_2_5y_date: '',
    next_insp_date: '',
    inspection_agency_id: '',
    periodic_inspection_pdf: null,
    next_insp_pdf: null,
    new_certificate_file: null,
    old_certificate_file: null,
  };
  const [formData, setFormData] = useState(emptyForm);

  // --- Load data ---
  useEffect(() => {
    if (mode === 'list') {
      fetchCertificates();
    } else {
      fetchTanks();
      fetchAgencies();
      if (mode === 'edit' && editingId) loadEditingData(editingId);
    }
  }, [mode, editingId]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const raw = await getAllCertificates();
      const data = unwrap(raw);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTanks = async () => {
    try {
      const raw = await getTanks();
      const data = unwrap(raw);
      const list = Array.isArray(data) ? data : [];
      // Only show active tanks (status === 1)
      setTanks(list.filter(t => t.status === 1));
    } catch (err) {
      console.error('Failed to fetch tanks:', err);
    }
  };

  const fetchAgencies = async () => {
    try {
      const raw = await getAllMasterData();
      const masters = unwrap(raw);
      if (masters && masters.inspection_agency) setAgencies(masters.inspection_agency);
    } catch (err) {
      console.error('Failed to fetch agencies:', err);
    }
  };

  const loadEditingData = async (id) => {
    try {
      const raw = await getAllCertificates();
      const all = unwrap(raw);
      const list = Array.isArray(all) ? all : [];
      const item = list.find(c => String(c.id) === String(id));
      if (item) {
        setExistingData(item);
        const fmtMonth = (v) => v ? v.replace('/', '-') : '';
        setFormData({
          tank_id: item.tank_id,
          certificate_number: item.certificate_number || '',
          insp_2_5y_date: fmtMonth(item.insp_2_5y_date),
          next_insp_date: fmtMonth(item.next_insp_date),
          inspection_agency_id: '', // Will be matched by useEffect when agencies load
          periodic_inspection_pdf: null,
          next_insp_pdf: null,
          new_certificate_file: null,
          old_certificate_file: null,
        });
      } else {
        console.warn('Certificate not found for id:', id, 'list:', list);
      }
    } catch (err) {
      console.error('Failed to load certificate data:', err);
    }
  };

  // Sync inspection_agency_id once agencies load
  useEffect(() => {
    if (mode === 'edit' && existingData && agencies.length > 0 && !formData.inspection_agency_id) {
      const match = agencies.find(a => a.agency_name === existingData.inspection_agency);
      if (match) {
        setFormData(prev => ({ ...prev, inspection_agency_id: match.id }));
      }
    }
  }, [agencies, existingData, mode]);

  // --- Filtering ---
  const filteredItems = useMemo(() => {
    if (!filterTerm) return items;
    return items.filter(item => String(item[searchBy] || '').toLowerCase().includes(filterTerm.toLowerCase()));
  }, [items, filterTerm, searchBy]);

  const handleSearch = () => setFilterTerm(searchTerm);
  const handleShowAll = () => { setSearchTerm(''); setFilterTerm(''); };

  // --- File Handling ---
  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert(`Only PDF files are allowed for this field.`);
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

  // --- Save ---
  const handleSave = async (e) => {
    e.preventDefault();

    // In edit mode tank_id comes from the loaded record, not from a select
    if (mode !== 'edit' && !formData.tank_id) {
      alert('Please select a Tank');
      return;
    }
    if (!formData.certificate_number || !String(formData.certificate_number).trim()) {
      alert('Please enter a Certificate Number');
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      // Only send tank_id on create
      if (mode !== 'edit') fd.append('tank_id', formData.tank_id);
      fd.append('certificate_number', String(formData.certificate_number));
      fd.append('insp_2_5y_date', formData.insp_2_5y_date || '');
      fd.append('next_insp_date', formData.next_insp_date || '');
      if (formData.inspection_agency_id) fd.append('inspection_agency_id', formData.inspection_agency_id);
      if (formData.periodic_inspection_pdf) fd.append('periodic_inspection_pdf', formData.periodic_inspection_pdf);
      if (formData.next_insp_pdf) fd.append('next_insp_pdf', formData.next_insp_pdf);
      if (formData.new_certificate_file) fd.append('new_certificate_file', formData.new_certificate_file);
      if (formData.old_certificate_file) fd.append('old_certificate_file', formData.old_certificate_file);

      // Clear flags: only send when user removed an existing file and didn't replace it
      if (mode === 'edit') {
        if (formData.periodic_inspection_pdf_removed && !formData.periodic_inspection_pdf)
          fd.append('clear_periodic_inspection_pdf', '1');
        if (formData.next_insp_pdf_removed && !formData.next_insp_pdf)
          fd.append('clear_next_insp_pdf', '1');
        if (formData.new_certificate_file_removed && !formData.new_certificate_file)
          fd.append('clear_new_certificate_file', '1');
        if (formData.old_certificate_file_removed && !formData.old_certificate_file)
          fd.append('clear_old_certificate_file', '1');
      }

      console.log('[CertSave] mode:', mode, 'editingId:', editingId);

      if (mode === 'edit' && editingId) {
        const result = await updateCertificate(editingId, fd);
        console.log('[CertSave] PUT result:', result);
        alert('Certificate updated successfully');
      } else {
        const result = await createCertificate(fd);
        console.log('[CertSave] POST result:', result);
        alert('Certificate added successfully');
      }
      navigate('/masters/certificates');
    } catch (err) {
      console.error('[CertSave] error:', err);
      // Middleware wraps errors as {success: false, message: '...'} – no .detail key
      const errBody = err.response?.data;
      const msg = errBody?.detail || errBody?.message || err.message || 'Unknown error';
      alert('Failed to save: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Status Toggle ---
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 1 ? 0 : 1;
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await updateCertificate(item.id, fd);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Status toggle failed:', err);
      alert('Failed to update status');
    }
  };

  // --- PDF Upload Card ---
  const PdfUploadCard = ({ slot }) => {
    const file = formData[slot.field];
    const existingUrl = existingData ? existingData[slot.dataField] : null;
    const existingName = existingData ? existingData[slot.nameField] : null;
    // Track if user explicitly removed the existing file (cleared it)
    const removedKey = `${slot.field}_removed`;
    const isRemoved = formData[removedKey] === true;
    const hasExisting = !!existingUrl && !isRemoved;
    const borderClass = colorBorder[slot.color] || colorBorder.blue;
    const iconClass = colorIcon[slot.color] || colorIcon.blue;

    // --- If a NEW file is picked ---
    if (file) {
      return (
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">{slot.label}</label>
            <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-green-400 bg-green-50 rounded-xl">
            <FileText className="w-7 h-7 text-green-500" />
            <span className="text-xs text-center text-gray-600 px-2 line-clamp-2 font-medium">{file.name}</span>
            <div className="flex items-center gap-3">
              <a
                href={URL.createObjectURL(file)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <Eye className="w-3 h-3" /> Preview
              </a>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, [slot.field]: null }))}
                className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1 font-semibold"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      );
    }

    // --- If existing file is present (edit mode) ---
    if (hasExisting) {
      return (
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">{slot.label}</label>
            <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-blue-200 bg-blue-50/40 rounded-xl px-2">
            <FileText className={`w-7 h-7 ${iconClass}`} />
            <span className="text-[11px] text-center text-gray-600 px-1 line-clamp-2 font-medium">
              {existingName || 'Uploaded PDF'}
            </span>
            <div className="flex items-center gap-2">
              {/* View button */}
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors"
              >
                <Eye className="w-3 h-3" /> View PDF
              </a>
              {/* Remove existing */}
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, [removedKey]: true }))}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-500 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
          {/* Replace option */}
          <label className="flex items-center justify-center gap-1 cursor-pointer text-[10px] text-gray-400 hover:text-[#10B981] font-semibold py-0.5 transition-colors">
            <Upload className="w-3 h-3" /> Replace PDF
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, slot.field)}
            />
          </label>
        </div>
      );
    }

    // --- Empty slot (no existing, no new file) ---
    return (
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <div className="flex justify-between items-center px-1">
          <label className="text-sm font-bold text-gray-700">{slot.label}</label>
          <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
        </div>
        <label className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer transition-all ${borderClass}`}>
          <FileText className={`w-7 h-7 ${iconClass}`} />
          <span className="text-xs text-center text-gray-500 px-2">Click to upload PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e, slot.field)}
          />
        </label>
      </div>
    );
  };


  // ================================================================
  // LIST VIEW
  // ================================================================
  if (mode === 'list') {
    return (
      <div className="flex flex-col flex-1 p-4 bg-gray-50 h-screen overflow-hidden">
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#546E7A]">Certificates Master</h1>
              <Button
                onClick={() => navigate('/masters/certificates/add')}
                variant="primary"
                icon={Plus}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] px-6"
              >
                Add Certificate
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-gray-700 font-semibold">Search by</span>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="h-10 px-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none bg-white min-w-[160px]"
              >
                <option value="tank_number">Tank Number</option>
                <option value="certificate_number">Certificate Number</option>
                <option value="inspection_agency">Inspection Agency</option>
              </select>

              <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-10 w-full pl-10 pr-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} icon={Search} className="bg-[#455A64] hover:bg-[#37474F]">Search</Button>
                <Button onClick={handleShowAll} icon={RotateCcw} className="bg-[#455A64] hover:bg-[#37474F]">Show All</Button>
                <Button variant="primary" icon={FileSpreadsheet} className="bg-[#2E7D32] hover:bg-[#1B5E20]">Export</Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#455A64] text-white z-10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Tank No</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Certificate No</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Agency</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">2.5Y Insp</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Next Insp</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">PDFs</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="8" className="py-10 text-center text-gray-400 italic">Loading certificates...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="8" className="py-10 text-center text-gray-400 italic">No records found.</td></tr>
                ) : (
                  filteredItems.map((item) => {
                    const pdfCount = [
                      item.periodic_inspection_pdf_path,
                      item.next_insp_pdf_path,
                      item.new_certificate_file,
                      item.old_certificate_file,
                    ].filter(Boolean).length;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-500">{item.id}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-700">{item.tank_number}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.certificate_number}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.inspection_agency || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.insp_2_5y_date || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.next_insp_date || '—'}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${pdfCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            <FileText className="w-3 h-3" /> {pdfCount}/4
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => navigate(`/masters/certificates/edit/${item.id}`)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <StatusToggle
                              active={item.status === 1}
                              onToggle={() => handleToggleStatus(item)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // ADD / EDIT FORM VIEW
  // ================================================================
  return (
    <div className="flex flex-col flex-1 p-4 bg-gray-100 h-screen overflow-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col space-y-4">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => navigate('/masters/certificates')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#546E7A]" />
          </button>
          <h1 className="text-2xl font-bold text-[#546E7A]">
            {mode === 'edit' ? 'Edit Certificate' : 'Add New Certificate'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <form onSubmit={handleSave} className="space-y-6">

            {/* Row 1: Tank + Certificate No + Agency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Tank Number <span className="text-red-500">*</span></label>
                <select
                  value={formData.tank_id}
                  onChange={(e) => setFormData(p => ({ ...p, tank_id: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
                  disabled={mode === 'edit'}
                >
                  <option value="">-- Select Tank --</option>
                  {tanks.map(t => <option key={t.id} value={t.id}>{t.tank_number}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Certificate Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. CERT-001"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData(p => ({ ...p, certificate_number: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Inspection Agency</label>
                <select
                  value={formData.inspection_agency_id}
                  onChange={(e) => setFormData(p => ({ ...p, inspection_agency_id: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none bg-white"
                >
                  <option value="">-- Select Agency --</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.agency_name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">2.5Y Inspection Date</label>
                <input
                  type="month"
                  value={formData.insp_2_5y_date}
                  onChange={(e) => setFormData(p => ({ ...p, insp_2_5y_date: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Next Inspection Date</label>
                <input
                  type="month"
                  value={formData.next_insp_date}
                  onChange={(e) => setFormData(p => ({ ...p, next_insp_date: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
                />
              </div>
            </div>

            {/* Row 3: 4 PDF Uploads */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
                Certificate PDFs <span className="font-normal normal-case text-gray-400">(PDF only · Max 2 MB each)</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {PDF_SLOTS.map(slot => (
                  <PdfUploadCard key={slot.field} slot={slot} />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/masters/certificates')}
                className="px-8 h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
