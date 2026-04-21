import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit, Eye, Search, RotateCcw,
  FileSpreadsheet, Save, ArrowLeft, Upload, X, FileText, Archive
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAllCertificates, createCertificate, updateCertificate } from '../services/tankCertificateService';
import { getTanks } from '../services/tankService';
import { exportToCSV } from '../utils/exportUtils';

import { getAllMasterData } from '../services/masterService';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { API_BASE_URL } from '../services/api';

const unwrap = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data;
  }
  return response;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const addMonthsToMonthStr = (monthStr, monthsToAdd) => {
  if (!monthStr) return '';
  try {
    const parts = monthStr.split('-');
    if (parts.length < 2) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) return '';

    // Add months
    const date = new Date(year, month - 1 + monthsToAdd, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch (e) {
    return '';
  }
};

const isNearing = (dateStr) => {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Handle both YYYY/MM and YYYY-MM
    const [y, m] = dateStr.replace('/', '-').split('-').map(Number);
    if (isNaN(y) || isNaN(m)) return false;

    const targetMonths = y * 12 + (m - 1);
    const currentMonths = currentYear * 12 + (currentMonth - 1);

    const diff = targetMonths - currentMonths;
    // Nearing if it's within 6 months
    return diff <= 6;
  } catch (e) {
    return false;
  }
};

const StatusToggle = ({ active, onToggle }) => (
  <button
    onClick={onToggle}
    title={active ? 'Active – click to deactivate' : 'Inactive – click to activate'}
    className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${active ? 'translate-x-7' : 'translate-x-1'}`} />
  </button>
);

// immutable: true  → locked in EDIT mode; freely uploadable in ADD mode
// immutable: false → certificate1, replaceable in EDIT, triggers cascade
const PDF_SLOTS = [
  { field: 'initial_certificate', dataField: 'initial_certificate_path', nameField: 'initial_certificate_name', label: 'Initial Certificate', color: 'blue', immutable: true },
  { field: 'certificate1', dataField: 'certificate1_path', nameField: 'certificate1_name', label: 'Certificate 1', color: 'indigo', immutable: false },
  { field: 'certificate2', dataField: 'certificate2_path', nameField: 'certificate2_name', label: 'Certificate 2', color: 'green', immutable: true },
  { field: 'certificate3', dataField: 'certificate3_path', nameField: 'certificate3_name', label: 'Certificate 3', color: 'amber', immutable: true },
  { field: 'certificate4', dataField: 'certificate4_path', nameField: 'certificate4_name', label: 'Certificate 4', color: 'purple', immutable: true },
  { field: 'certificate5', dataField: 'certificate5_path', nameField: 'certificate5_name', label: 'Certificate 5', color: 'teal', immutable: true },
];

const colorBorder = {
  blue: 'hover:border-blue-400 hover:bg-blue-50',
  indigo: 'hover:border-indigo-400 hover:bg-indigo-50',
  green: 'hover:border-green-400 hover:bg-green-50',
  amber: 'hover:border-amber-400 hover:bg-amber-50',
  purple: 'hover:border-purple-400 hover:bg-purple-50',
  teal: 'hover:border-teal-400 hover:bg-teal-50',
};
const colorIcon = {
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
  green: 'text-green-500',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  teal: 'text-teal-400',
};
const colorBadge = {
  blue: 'bg-blue-50 border-blue-200',
  indigo: 'bg-indigo-50 border-indigo-200',
  green: 'bg-green-50 border-green-200',
  amber: 'bg-amber-50 border-amber-200',
  purple: 'bg-purple-50 border-purple-200',
  teal: 'bg-teal-50 border-teal-200',
};

export default function CertificatesMasterPage({ mode = 'list' }) {
  const navigate = useNavigate();
  const { id: editingId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [searchBy, setSearchBy] = useState('tank_number');

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
    initial_certificate: null,
    remove_initial_certificate: false,
    certificate1: null,
    remove_certificate1: false,
    certificate2: null,
    remove_certificate2: false,
    certificate3: null,
    remove_certificate3: false,
    certificate4: null,
    remove_certificate4: false,
    certificate5: null,
    remove_certificate5: false,
    remarks: '',
  };
  const [formData, setFormData] = useState(emptyForm);

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
      setTanks(list.filter(t => t.status === 'active' || t.status === 1));
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
          inspection_agency_id: '',
          initial_certificate: null,
          remove_initial_certificate: false,
          certificate1: null,
          remove_certificate1: false,
          certificate2: null,
          remove_certificate2: false,
          certificate3: null,
          remove_certificate3: false,
          certificate4: null,
          remove_certificate4: false,
          certificate5: null,
          remove_certificate5: false,
          remarks: item.remarks || '',
        });
      } else {
        console.warn('Certificate not found for id:', id);
      }
    } catch (err) {
      console.error('Failed to load certificate data:', err);
    }
  };

  useEffect(() => {
    if (mode === 'edit' && existingData && agencies.length > 0 && !formData.inspection_agency_id) {
      const match = agencies.find(a => a.agency_name === existingData.inspection_agency);
      if (match) setFormData(prev => ({ ...prev, inspection_agency_id: match.id }));
    }
  }, [agencies, existingData, mode]);

  // ── Live cascade preview ───────────────────────────────────────────────
  // When the user stages a new cert1 in EDIT mode, compute what the slots
  // will look like after the shift so the UI reflects it immediately.
  // Nothing is saved until the user clicks Save.
  const cascadePreview = useMemo(() => {
    if (mode !== 'edit' || !formData.certificate1 || !existingData || formData.remove_certificate1) return null;
    return {
      // cert1 slot → new file (handled by formData, not previewData)
      certificate2_path: existingData.certificate1_path,
      certificate2_name: existingData.certificate1_name,
      certificate3_path: existingData.certificate2_path,
      certificate3_name: existingData.certificate2_name,
      certificate4_path: existingData.certificate3_path,
      certificate4_name: existingData.certificate3_name,
      certificate5_path: existingData.certificate4_path,
      certificate5_name: existingData.certificate4_name,
      // cert5 of the existing record will be archived
      will_archive_path: existingData.certificate5_path,
      will_archive_name: existingData.certificate5_name,
    };
  }, [mode, formData.certificate1, existingData]);

  const filteredItems = useMemo(() => {
    if (!filterTerm) return items;
    return items.filter(item => String(item[searchBy] || '').toLowerCase().includes(filterTerm.toLowerCase()));
  }, [items, filterTerm, searchBy]);

  const handleSearch = () => setFilterTerm(searchTerm);
  const handleShowAll = () => { setSearchTerm(''); setFilterTerm(''); };

  const handleExport = (nearingOnly = false) => {
    const dataToExport = nearingOnly ? filteredItems.filter(item => item.isNearing) : filteredItems;
    
    const headers = [
      { label: 'ID', key: 'id' },
      { label: 'Tank No', key: 'tank_number' },
      { label: 'Certificate No', key: 'certificate_number' },
      { label: 'Agency', key: 'inspection_agency' },
      { label: '2.5Y Insp', key: 'inspection_date_2_5' },
      { label: 'Next Insp', key: 'next_inspection_date' },
      { label: 'Remarks', key: 'remarks' },
      { 
        label: 'Status', 
        key: 'status',
        formatter: (val) => Number(val ?? 1) === 1 ? 'Active' : 'Inactive'
      }
    ];
    
    const fileName = nearingOnly ? 'Certificates_Nearing_6_Months.csv' : 'Certificates_Master.csv';
    exportToCSV(dataToExport, headers, fileName);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // --- Tank Number Validation (Numeric check) ---
    const selectedTank = tanks.find(t => String(t.id) === String(formData.tank_id));
    const tankNumber = selectedTank ? selectedTank.tank_number : (existingData ? existingData.tank_number : '');

    if (!tankNumber) {
      alert('Please select a Tank Number first.');
      e.target.value = '';
      return;
    }

    const numericPart = tankNumber.replace(/\D/g, '');
    const fileNumericPart = file.name.replace(/\D/g, '');

    if (numericPart && !fileNumericPart.includes(numericPart)) {
      alert(`Filename mismatch! The file name "${file.name}" must contain the number "${numericPart}" from Tank Number "${tankNumber}".`);
      e.target.value = '';
      return;
    }
    // ----------------------------------------------

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed for this field.');
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

    if (mode !== 'edit' && !formData.tank_id) { alert('Please select a Tank'); return; }
    if (!formData.certificate_number || !String(formData.certificate_number).trim()) {
      alert('Please enter a Certificate Number'); return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      if (mode !== 'edit') fd.append('tank_id', formData.tank_id);
      fd.append('certificate_number', String(formData.certificate_number));
      fd.append('insp_2_5y_date', formData.insp_2_5y_date || '');
      fd.append('next_insp_date', formData.next_insp_date || '');
      if (formData.inspection_agency_id) fd.append('inspection_agency_id', formData.inspection_agency_id);
      fd.append('remarks', formData.remarks || '');

      if (mode !== 'edit') {
        if (formData.initial_certificate) fd.append('initial_certificate', formData.initial_certificate);
        if (formData.certificate1) fd.append('certificate1', formData.certificate1);
        if (formData.certificate2) fd.append('certificate2', formData.certificate2);
        if (formData.certificate3) fd.append('certificate3', formData.certificate3);
        if (formData.certificate4) fd.append('certificate4', formData.certificate4);
        if (formData.certificate5) fd.append('certificate5', formData.certificate5);
      } else {
        ['initial_certificate', 'certificate1', 'certificate2', 'certificate3', 'certificate4', 'certificate5'].forEach(f => {
          if (formData[f]) fd.append(f, formData[f]);
          if (formData[`remove_${f}`]) fd.append(`remove_${f}`, 'true');
        });
      }

      if (mode === 'edit' && editingId) {
        await updateCertificate(editingId, fd);
        alert('Certificate updated successfully');
      } else {
        await createCertificate(fd);
        alert('Certificate added successfully');
      }
      navigate('/masters/certificates');
    } catch (err) {
      console.error('[CertSave] error:', err);
      const errBody = err.response?.data;
      const msg = errBody?.detail || errBody?.message || err.message || 'Unknown error';
      alert('Failed to save: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = Number(item.status ?? 1) === 1 ? 0 : 1;
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

  // -----------------------------------------------------------------------
  // PDF Upload Card
  // -----------------------------------------------------------------------
  const PdfUploadCard = ({ slot }) => {
    const isEditMode = mode === 'edit';
    const iconClass = colorIcon[slot.color] || colorIcon.blue;
    const badgeClass = colorBadge[slot.color] || colorBadge.blue;
    const borderClass = colorBorder[slot.color] || colorBorder.blue;

    // -- Resolve display data for this slot --
    // In preview mode (cert1 staged), immutable slots 2-5 show shifted content
    let displayUrl = existingData ? existingData[slot.dataField] : null;
    let displayName = existingData ? existingData[slot.nameField] : null;
    let isPreviewShifted = false;  // true when slot shows cascade-shifted preview content
    let willBeArchived = false;  // true when slot5 content will be archived

    if (isEditMode && cascadePreview && slot.immutable && slot.field !== 'initial_certificate') {
      const previewPath = cascadePreview[`${slot.field}_path`];
      const previewName = cascadePreview[`${slot.field}_name`];
      // slot5: check if it will be archived
      if (slot.field === 'certificate5' && cascadePreview.will_archive_path) {
        willBeArchived = true;
        displayUrl = cascadePreview.will_archive_path;
        displayName = cascadePreview.will_archive_name;
        isPreviewShifted = true;
      } else {
        displayUrl = previewPath || null;
        displayName = previewName || null;
        isPreviewShifted = true;
      }
    }

    const hasDisplay = !!displayUrl;
    const stagedFile = formData[slot.field];

    const isRemoved = formData[`remove_${slot.field}`];

    // ── EDIT MODE ──────────────────────────────────────────────────────────
    if (isEditMode) {

      if (isRemoved && !stagedFile) {
        return (
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                {slot.label}
              </label>
              <span className="text-[10px] text-red-500 font-bold">Will be removed</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-red-300 bg-red-50 rounded-xl px-2">
              <span className="text-xs text-center text-red-500 px-2 font-semibold">Removing PDF</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData(p => ({ ...p, [`remove_${slot.field}`]: false }))}
                  className="text-[11px] text-blue-500 hover:underline font-semibold">
                  Undo Remove
                </button>
                <label className="cursor-pointer text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                  Upload New
                  <input type="file" accept=".pdf,application/pdf" className="hidden"
                    onChange={(e) => handleFileChange(e, slot.field)} />
                </label>
              </div>
            </div>
          </div>
        );
      }

      if (stagedFile) {
        return (
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                {slot.label}
              </label>
              <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
            </div>
            <div className={`flex flex-col items-center justify-center gap-2 h-28 border-2 rounded-xl px-2 ${badgeClass}`}>
              <FileText className={`w-7 h-7 ${iconClass}`} />
              <span className="text-xs text-center text-gray-600 px-2 line-clamp-2 font-medium">{stagedFile.name}</span>
              <div className="flex items-center gap-3">
                <a href={URL.createObjectURL(stagedFile)} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                  <Eye className="w-3 h-3" /> Preview
                </a>
                <button type="button" onClick={() => setFormData(p => ({ ...p, [slot.field]: null }))}
                  className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1 font-semibold">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
            {isRemoved ? (
              <div className="text-[10px] text-center text-amber-600 font-bold mt-1">Replacing without cascade</div>
            ) : (slot.field === 'certificate1' && existingData && existingData.certificate1_path) ? (
              <div className="text-[10px] text-center text-green-600 font-bold mt-1">Will shift other certs</div>
            ) : null}
          </div>
        );
      }

      if (hasDisplay) {
        return (
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                {slot.label}
              </label>
              {isPreviewShifted && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${willBeArchived ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {willBeArchived ? 'Archive' : 'Shifted'}
                </span>
              )}
            </div>
            <div className={`flex flex-col items-center justify-center gap-2 h-28 border-2 rounded-xl px-2 transition-all ${willBeArchived
              ? 'bg-red-50 border-red-300'
              : isPreviewShifted
                ? 'bg-amber-50 border-amber-300'
                : badgeClass
              }`}>
              <FileText className={`w-7 h-7 ${willBeArchived ? 'text-red-400' : isPreviewShifted ? 'text-amber-500' : iconClass}`} />
              <span className="text-[11px] text-center text-gray-600 px-1 line-clamp-2 font-medium">
                {displayName || 'Uploaded PDF'}
              </span>
              <a href={displayUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors">
                <Eye className="w-3 h-3" /> View PDF
              </a>
            </div>

            {!isPreviewShifted && (
              <div className="flex justify-center gap-3 w-full mt-1">
                <label className="flex items-center justify-center gap-1 cursor-pointer text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold py-0.5 transition-colors">
                  <Upload className="w-3 h-3" /> Replace PDF
                  <input type="file" accept=".pdf,application/pdf" className="hidden"
                    onChange={(e) => handleFileChange(e, slot.field)} />
                </label>
                <button type="button" onClick={() => setFormData(p => ({ ...p, [`remove_${slot.field}`]: true }))}
                  className="flex items-center justify-center gap-1 text-[10px] text-red-500 hover:text-red-700 font-semibold py-0.5 transition-colors">
                  <X className="w-3 h-3" /> Remove PDF
                </button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
              {slot.label}
            </label>
            <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
          </div>
          <label className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer transition-all ${borderClass}`}>
            <FileText className={`w-7 h-7 ${iconClass}`} />
            <span className="text-xs text-center text-gray-500 px-2">Click to upload PDF</span>
            <input type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={(e) => handleFileChange(e, slot.field)} />
          </label>
        </div>
      );
    }

    // ── ADD MODE — all 6 slots freely uploadable ───────────────────────────
    if (stagedFile) {
      return (
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">{slot.label}</label>
            <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
          </div>
          <div className={`flex flex-col items-center justify-center gap-2 h-28 border-2 rounded-xl px-2 ${badgeClass}`}>
            <FileText className={`w-7 h-7 ${iconClass}`} />
            <span className="text-xs text-center text-gray-600 px-2 line-clamp-2 font-medium">{stagedFile.name}</span>
            <div className="flex items-center gap-3">
              <a href={URL.createObjectURL(stagedFile)} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                <Eye className="w-3 h-3" /> Preview
              </a>
              <button type="button" onClick={() => setFormData(p => ({ ...p, [slot.field]: null }))}
                className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1 font-semibold">
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <div className="flex justify-between items-center px-1">
          <label className="text-sm font-bold text-gray-700">{slot.label}</label>
          <span className="text-[10px] text-gray-400 italic">PDF · Max 2 MB</span>
        </div>
        <label className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer transition-all ${borderClass}`}>
          <FileText className={`w-7 h-7 ${iconClass}`} />
          <span className="text-xs text-center text-gray-500 px-2">Click to upload PDF</span>
          <input type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={(e) => handleFileChange(e, slot.field)} />
        </label>
      </div>
    );
  };

  // ================================================================
  // LIST VIEW
  // ================================================================
  if (mode === 'list') {
    return (
      <div className="flex flex-col flex-1 p-2 bg-gray-50 h-screen overflow-hidden">
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#546E7A]">Certificates Master</h1>
              <Button onClick={() => navigate('/masters/certificates/add')} variant="primary" icon={Plus} className="bg-[#2E7D32] hover:bg-[#1B5E20] px-6">
                Add Certificate
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-gray-700 font-semibold">Search by</span>
              <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)}
                className="h-10 px-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none bg-white min-w-[160px]">
                <option value="tank_number">Tank Number</option>
                <option value="certificate_number">Certificate Number</option>
                <option value="inspection_agency">Inspection Agency</option>
                <option value="remarks">Remarks</option>
              </select>
              <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Type to search..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-10 w-full pl-10 pr-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} icon={Search} className="bg-[#455A64] hover:bg-[#37474F]">Search</Button>
                <Button onClick={handleShowAll} icon={RotateCcw} className="bg-[#455A64] hover:bg-[#37474F]">Show All</Button>
                <Button onClick={() => handleExport(false)} variant="primary" icon={FileSpreadsheet} className="bg-[#2E7D32] hover:bg-[#1B5E20]">Export</Button>
                <Button onClick={() => handleExport(true)} variant="primary" icon={FileSpreadsheet} className="bg-[#E65100] hover:bg-[#EF6C00]">Export 6 Months</Button>
              </div>
            </div>
          </div>

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
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Remarks</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">PDFs</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Archived</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="10" className="py-10 text-center text-gray-400 italic">Loading certificates...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="10" className="py-10 text-center text-gray-400 italic">No records found.</td></tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const pdfCount = [item.initial_certificate_path, item.certificate1_path, item.certificate2_path, item.certificate3_path, item.certificate4_path, item.certificate5_path].filter(Boolean).length;
                    const archiveCount = item.archives || 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-700">{item.tank_number}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.certificate_number}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.inspection_agency || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.insp_2_5y_date || '—'}</td>
                        <td className={`px-4 py-4 text-sm ${isNearing(item.next_insp_date) ? 'font-bold text-red-600' : 'text-gray-600'}`}>
                          {item.next_insp_date || '—'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 italic max-w-[150px] truncate" title={item.remarks}>{item.remarks || '—'}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${pdfCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            <FileText className="w-3 h-3" /> {pdfCount}/6
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${archiveCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                            <Archive className="w-3 h-3" /> {archiveCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button onClick={() => navigate(`/masters/certificates/edit/${item.id}`)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                              <Edit className="w-5 h-5" />
                            </button>
                            <StatusToggle active={Number(item.status ?? 1) === 1} onToggle={() => handleToggleStatus(item)} />
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
  const archiveCount = existingData?.archives || 0;

  return (
    <div className="flex flex-col flex-1 p-2 bg-gray-100 h-screen overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-2">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <button onClick={() => navigate('/masters/certificates')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#546E7A]" />
          </button>
          <h1 className="text-2xl font-bold text-[#546E7A]">
            {mode === 'edit' ? 'Edit Certificate' : 'Add New Certificate'}
          </h1>
          {mode === 'edit' && archiveCount > 0 && (
            <span className="ml-auto flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200">
              <Archive className="w-3.5 h-3.5" /> {archiveCount} archived
            </span>
          )}
        </div>

        {/* Form */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 overflow-auto flex-1">
          <form onSubmit={handleSave} className="space-y-4">

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Tank Number <span className="text-red-500">*</span></label>
                <SearchableSelect label="" id="tank_select" value={formData.tank_id}
                  onChange={(e) => setFormData(p => ({ ...p, tank_id: e.target.value }))}
                  options={tanks.map(t => ({ value: t.id, label: t.tank_number }))}
                  placeholder="-- Select Tank --" disabled={mode === 'edit'} className="h-11" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Certificate Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. CERT-001" value={formData.certificate_number}
                  onChange={(e) => setFormData(p => ({ ...p, certificate_number: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Inspection Agency</label>
                <select value={formData.inspection_agency_id}
                  onChange={(e) => setFormData(p => ({ ...p, inspection_agency_id: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none bg-white">
                  <option value="">-- Select Agency --</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.agency_name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">2.5Y Inspection Date</label>
                <input type="month" value={formData.insp_2_5y_date}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(p => ({
                      ...p,
                      insp_2_5y_date: val,
                      next_insp_date: val ? addMonthsToMonthStr(val, 30) : p.next_insp_date
                    }));
                  }}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Next Inspection Date</label>
                <input type="month" value={formData.next_insp_date}
                  onChange={(e) => setFormData(p => ({ ...p, next_insp_date: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none" />
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Remarks</label>
              <input type="text" placeholder="Enter remarks (max 30 chars)..." maxLength={30}
                value={formData.remarks} onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none" />
            </div>

            {/* Certificate PDFs */}
            <div>
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Certificate PDFs <span className="font-normal normal-case text-gray-400">(PDF only · Max 2 MB each)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PDF_SLOTS.map(slot => (
                  <PdfUploadCard key={slot.field} slot={slot} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/masters/certificates')}
                className="px-8 h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" disabled={isSaving}
                className="px-8 h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded font-bold flex items-center gap-2 transition-colors shadow-sm">
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
