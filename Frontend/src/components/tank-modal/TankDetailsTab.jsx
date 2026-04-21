import React, { useState, useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { createTank, updateTank, getTankById, uploadTankImage } from '../../services/tankService';
import { getAllMasterData } from '../../services/masterService';
import { getMasterRegulations } from '../../services/regulationService';
import { getUploadUrl } from '../../services/api';
import { MultiSelect } from '../ui/MultiSelect';

const initialState = {
  tank_number: '',
  owner: '',
  mfgr: '',
  initial_test_date: '',
  date_mfg: '',
  pv_code: [],
  tank_code: '',
  un_code: '',
  capacity_l: '',
  mawp: '',
  design_temperature: '',
  tare_weight_kg: '',
  mgw_kg: '',
  mpl_kg: '',
  size: '6058 x 2438 x 2591 mm',
  pump_type: '',
  vesmat: '',
  gross_kg: '',
  net_kg: '',
  color_body_frame: '',
  cabinet_type: '',
  frame_type: '',
  remark: '',
  evacuation_valve: '',
  tank_number_image_path: '',
  created_by: 'Admin',
  updated_by: 'Admin',
  regulations: [],
  product_id: '',
  safety_valve_brand_id: '',
  remark2: '',
};

export default function TankDetailsTab({ onClose, onSaveSuccess, tankId, existingTanks }) {
  const [formData, setFormData] = useState(initialState);
  const [viewingImage, setViewingImage] = useState(null);

  const [masterData, setMasterData] = useState({
    manufacturer: [],
    standard: [],
    tankcode_iso: [],
    un_iso_code: [],
    design_temperature: [],
    cabinet: [],
    frame_type: [],
    pump: [],
    mawp: [],
    ownership: [],
    size: [],
    regulations: [],
    products: [],
    safety_valve_brands: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [errors, setErrors] = useState({});

  const isEditMode = !!tankId;

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
  const errorClass = 'border-red-500 focus:ring-red-500';

  // ensure inputs never get null/undefined
  const safeValue = (v) => (v == null ? '' : v);

  // --- HELPER FUNCTIONS ---
  const getOptValue = (opt) => {
    if (opt === null || opt === undefined) return '';
    if (typeof opt !== 'object') return opt;
    return opt.name || opt.code || opt.standard || opt.value || opt.label || JSON.stringify(opt);
  };

  const getOptLabel = (opt) => {
    if (opt === null || opt === undefined) return '';
    if (typeof opt !== 'object') return opt;
    return opt.name || opt.label || opt.code || opt.standard || opt.value || JSON.stringify(opt);
  };

  const formatTempLabel = (opt) => {
    const lbl = getOptLabel(opt);
    if (typeof lbl !== 'string') return lbl;
    // Replace occurrences like " C" with the degree symbol + C (e.g. "°C").
    return lbl.replace(/ ?C\b/g, '°C');
  };

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        setLoadingMasters(true);
        const data = await getAllMasterData();
        const masterRegs = await getMasterRegulations();
        if (data) {
          // backend uses success_resp which envelopes data in a 'data' field
          const regsList = (masterRegs?.data && Array.isArray(masterRegs.data))
            ? masterRegs.data.filter(r => r.status !== 0)
            : [];
          setMasterData({
            ...data,
            regulations: regsList
          });
        }
      } catch (err) {
        console.error('Failed to load dropdown masters:', err);
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(initialState);
      return;
    }

    if (loadingMasters) return;

    const fetchTankData = async () => {
      try {
        const data = await getTankById(tankId);

        let loadedMawp = data.mawp || '';
        if (data.mawp && masterData.mawp?.length > 0) {
          const mawpStr = String(data.mawp).trim();
          const match = masterData.mawp.find((m) =>
            getOptValue(m).toString().trim().startsWith(mawpStr),
          );
          if (match) loadedMawp = getOptValue(match);
        }

        let loadedStandardIds = [];
        const standardSource = data.standard || data.pv_code || '';
        if (standardSource && masterData.standard?.length > 0) {
          loadedStandardIds = String(standardSource)
            .split(',')
            .map((s) => s.trim())
            .map((name) => {
              const match = masterData.standard.find(
                (s) => getOptValue(s).trim() === name,
              );
              return match ? String(match.id) : null;
            })
            .filter(Boolean);
        }

        setFormData({
          ...initialState,
          ...data,
          tank_code: data.tank_iso_code || '',
          initial_test_date: data.initial_test || '',
          mawp: loadedMawp,
          size: data.size || '6058 x 2438 x 2591 mm',
          pv_code: loadedStandardIds,
          un_code: (() => {
            const unSource = data.un_code || data.un_iso_code || '';
            if (!unSource) return '';
            const codes = String(unSource).split(',').map((c) => c.trim());
            if (codes.length === 0) return '';
            
            const firstCode = codes[0];
            const m = masterData.un_iso_code?.find(
              (u) => getOptValue(u).toString() === firstCode,
            );
            return m ? String(m.id) : '';
          })(),
          mpl_kg: (() => {
            const mgw = parseFloat(data.mgw_kg);
            const tare = parseFloat(data.tare_weight_kg);
            return !isNaN(mgw) && !isNaN(tare)
              ? String(mgw - tare)
              : '';
          })(),
          updated_by: 'Admin',
          regulations: data.regulations || [],
          product_id: data.product_id || '',
          safety_valve_brand_id: data.safety_valve_brand_id || '',
          remark2: data.remark2 || '',
        });
      } catch (err) {
        console.error('Failed to fetch tank data', err);
      }
    };

    fetchTankData();
  }, [tankId, isEditMode, loadingMasters, masterData]);


  const handleChange = (e) => {
    const { name, value, multiple, selectedOptions } = e.target;
    let newVal = value;
    if (multiple) {
      newVal = Array.from(selectedOptions).map((o) => o.value);
    }
    let newFormData = { ...formData, [name]: newVal };

    if (name === 'mgw_kg' || name === 'tare_weight_kg') {
      const mgw = name === 'mgw_kg' ? parseFloat(value) : parseFloat(formData.mgw_kg);
      const tare =
        name === 'tare_weight_kg' ? parseFloat(value) : parseFloat(formData.tare_weight_kg);
      if (!isNaN(mgw) && !isNaN(tare)) newFormData.mpl_kg = (mgw - tare).toString();
    }
    if (name === 'un_code') {
      const unCodeId = value;
      let productId = '';
      if (unCodeId) {
        const product = masterData.products?.find(
          (p) => String(p.un_code_id) === String(unCodeId)
        );
        if (product) {
          productId = String(product.id);
        }
      }
      newFormData.product_id = productId;
    }

    setFormData(newFormData);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleTankNumberBlur = () => {
    const val = formData.tank_number?.trim();
    if (!val || !existingTanks) return;

    // Check if this tank number exists in other records
    const duplicate = existingTanks.find(t =>
      t.tank_number?.toLowerCase() === val.toLowerCase() && t.id !== tankId
    );

    if (duplicate) {
      alert(`The tank number "${val}" already exists!`);
      setErrors(prev => ({ ...prev, tank_number: 'This tank already exists.' }));
    }
  };



  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.substring(0, 7);
  };

  const validate = () => {
    const newErrors = {};
    const data = formData;

    const requiredFields = [
      'tank_number',
      'owner',
      'mfgr',
      'tank_code',
      'un_code',
      'capacity_l',
      'mawp',
      'design_temperature',
      'tare_weight_kg',
      'mgw_kg',
      'size',
      'pump_type',
      'cabinet_type',
      'frame_type',
      'initial_test_date',
    ];

    requiredFields.forEach((field) => {
      const val = data[field];
      if (Array.isArray(val)) {
        if (val.length === 0) newErrors[field] = 'This field is required.';
      } else {
        if (!val) newErrors[field] = 'This field is required.';
      }
    });

    if (data.tank_number && data.tank_number.length > 20) {
      newErrors.tank_number = 'Max 20 characters allowed.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getIdFromName = (list, selectedValue, idKey = 'id') => {
    if (!list || !selectedValue) return null;
    if (typeof list[0] === 'string') return null;

    const item = list.find((x) => getOptValue(x) === selectedValue);
    return item ? item[idKey] : null;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = { ...formData };

      // Remove mpl_kg as it's auto-calculated in backend
      delete payload.mpl_kg;

      payload.initial_test = formData.initial_test_date;
      payload.tank_iso_code = formData.tank_code;

      // Handle Image Upload
      if (formData._imageFile) {
        try {
          const uploadRes = await uploadTankImage(formData._imageFile);
          if (uploadRes && uploadRes.path) {
            payload.tank_number_image_path = uploadRes.path;
          }
        } catch (uploadErr) {
          console.error("Image upload failed", uploadErr);
          alert("Image upload failed, saving tank without updating image.");
        }
      }
      delete payload._imageFile;

      // Ensure multi-select fields are arrays of IDs (numbers)
      payload.standard = Array.isArray(formData.pv_code)
        ? formData.pv_code.map((v) => parseInt(v, 10))
        : formData.pv_code;
      payload.un_code = formData.un_code ? [parseInt(formData.un_code, 10)] : [];
      payload.regulations = Array.isArray(formData.regulations)
        ? formData.regulations.map((v) => parseInt(v, 10))
        : formData.regulations;

      payload.product_id = formData.product_id ? parseInt(formData.product_id, 10) : null;
      payload.safety_valve_brand_id = formData.safety_valve_brand_id ? parseInt(formData.safety_valve_brand_id, 10) : null;

      // Remove updated_by as it's set in backend
      payload.updated_by = 'Admin';


      if (payload.mawp) payload.mawp = parseFloat(payload.mawp);
      if (payload.working_pressure) payload.working_pressure = parseFloat(payload.working_pressure);

      let savedTankId = tankId; // Start with current ID (null if creating)

      if (!isEditMode) {
        payload.ownership_id = getIdFromName(masterData.ownership, formData.owner);
        payload.manufacturer_id = getIdFromName(masterData.manufacturer, formData.mfgr);
        payload.tank_iso_code_id = getIdFromName(masterData.tankcode_iso, formData.tank_code);
        payload.design_temperature_id = getIdFromName(
          masterData.design_temperature,
          formData.design_temperature,
        );
        payload.cabinet_id = getIdFromName(masterData.cabinet, formData.cabinet_type);
        payload.frame_type_id = getIdFromName(masterData.frame_type, formData.frame_type);
        payload.pump_id = getIdFromName(masterData.pump, formData.pump_type);
        payload.mawp_id = getIdFromName(masterData.mawp, formData.mawp);
        // Send the free-form size string to the backend (backend accepts `size` or `size_id`).
        payload.size = formData.size;

        const response = await createTank(payload);
        console.log('Create Tank Response:', response); // Debugging

        // --- ROBUST ID EXTRACTION ---
        if (response) {
          // Check various patterns for the ID
          if (response.id) savedTankId = response.id;
          else if (response.data && response.data.id) savedTankId = response.data.id;
          else if (typeof response === 'number') savedTankId = response; // Direct number
          else if (response.tank_id) savedTankId = response.tank_id;
        }

        if (!savedTankId) {
          alert('Tank Saved, but could not retrieve ID from server. Please check console.');
          console.error('Could not find ID in:', response);
          return; // STOP HERE if no ID found
        }

        alert('Tank created successfully!');
      } else {
        await updateTank(tankId, payload);
        alert('Tank updated successfully!');
      }

      // Pass the found ID back to parent
      console.log('Passing ID to parent:', savedTankId);
      onSaveSuccess(savedTankId);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.detail || err.message;
      alert(`Failed to save tank: ${errMsg}`);
      setErrors({
        form: 'Failed to save tank. ' + errMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {errors.form && (
        <div className="p-3 mb-4 text-red-800 bg-red-100 border border-red-300 rounded-md">
          {errors.form}
        </div>
      )}

      <div className="flex-grow overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {/* Tank Number */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Tank Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tank_number"
              value={safeValue(formData.tank_number)}
              onChange={handleChange}
              onBlur={handleTankNumberBlur}
              className={`${inputClass} ${errors.tank_number ? errorClass : ''}`}
            />
            {errors.tank_number && (
              <p className="text-xs text-red-500 mt-1">{errors.tank_number}</p>
            )}
          </div>

          {/* Owner */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Owner <span className="text-red-500">*</span>
            </label>
            <select
              name="owner"
              value={safeValue(formData.owner)}
              onChange={handleChange}
              className={`${inputClass} ${errors.owner ? errorClass : ''}`}
            >
              <option value="">-- Select Owner --</option>
              {masterData.ownership?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
          </div>

          {/* Manufacturer */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Manufacturer <span className="text-red-500">*</span>
            </label>
            <select
              name="mfgr"
              value={safeValue(formData.mfgr)}
              onChange={handleChange}
              className={`${inputClass} ${errors.mfgr ? errorClass : ''}`}
            >
              <option value="">-- Select Manufacturer --</option>
              {masterData.manufacturer?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.mfgr && <p className="text-xs text-red-500 mt-1">{errors.mfgr}</p>}
          </div>

          {/* Initial Test Date */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Initial Test Date <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              name="initial_test_date"
              value={safeValue(formatDateForInput(formData.initial_test_date))}
              onChange={handleChange}
              className={`${inputClass} ${errors.initial_test_date ? errorClass : ''}`}
            />
            {errors.initial_test_date && (
              <p className="text-xs text-red-500 mt-1">{errors.initial_test_date}</p>
            )}
          </div>

          {/* Date MFG */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Date MFG <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              name="date_mfg"
              value={safeValue(formatDateForInput(formData.date_mfg))}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Standard field hidden per request. Previously a multi-select for applicable standards. */}

          {/* Tank Code / ISO Code */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Tank Code / ISO Code <span className="text-red-500">*</span>
            </label>
            <select
              name="tank_code"
              value={safeValue(formData.tank_code)}
              onChange={handleChange}
              className={`${inputClass} ${errors.tank_code ? errorClass : ''}`}
            >
              <option value="">-- Select Tank Code --</option>
              {masterData.tankcode_iso?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.tank_code && <p className="text-xs text-red-500 mt-1">{errors.tank_code}</p>}
          </div>

          {/* UN Code */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              UN Code <span className="text-red-500">*</span>
            </label>
            <select
              name="un_code"
              value={safeValue(formData.un_code)}
              onChange={handleChange}
              className={`${inputClass} ${errors.un_code ? errorClass : ''}`}
            >
              <option value="">-- Select UN Code --</option>
              {masterData.un_iso_code?.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.code || getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.un_code && <p className="text-xs text-red-500 mt-1">{errors.un_code}</p>}
          </div>

          {/* Product (Auto-filled from UN Code) */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Product
            </label>
            <input
              type="text"
              value={(() => {
                const prod = masterData.products?.find(p => String(p.id) === String(formData.product_id));
                return prod ? prod.name : '';
              })()}
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              placeholder="Auto-filled from UN Code"
            />
          </div>

          {/* Safety Valve Brand (Read-only in Tank Master) */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Safety Valve Brand
            </label>
            <input
              type="text"
              value={(() => {
                const brandId = formData.safety_valve_brand_id;
                const brand = masterData.safety_valve_brands?.find(b => String(b.id) === String(brandId));
                return brand ? brand.name || brand.brand_name : 'N/A';
              })()}
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              placeholder="Set from Inspection"
            />
          </div>

          {/* Capacity */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Actual Capacity (L) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="capacity_l"
              value={safeValue(formData.capacity_l)}
              onChange={handleChange}
              className={`${inputClass} ${errors.capacity_l ? errorClass : ''}`}
            />
            {errors.capacity_l && (
              <p className="text-xs text-red-500 mt-1">{errors.capacity_l}</p>
            )}
          </div>

          {/* MAWP */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              MAWP <span className="text-red-500">*</span>
            </label>
            <select
              name="mawp"
              value={safeValue(formData.mawp)}
              onChange={handleChange}
              className={`${inputClass} ${errors.mawp ? errorClass : ''}`}
            >
              <option value="">-- Select MAWP --</option>
              {masterData.mawp?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.mawp && <p className="text-xs text-red-500 mt-1">{errors.mawp}</p>}
          </div>

          {/* Design Temperature */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Design Temperature <span className="text-red-500">*</span>
            </label>
            <select
              name="design_temperature"
              value={safeValue(formData.design_temperature)}
              onChange={handleChange}
              className={`${inputClass} ${errors.design_temperature ? errorClass : ''}`}
            >
              <option value="">-- Select Temp --</option>
              {masterData.design_temperature?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {formatTempLabel(opt)}
                </option>
              ))}
            </select>
            {errors.design_temperature && (
              <p className="text-xs text-red-500 mt-1">{errors.design_temperature}</p>
            )}
          </div>

          {/* Tare Weight */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Tare Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="tare_weight_kg"
              value={safeValue(formData.tare_weight_kg)}
              onChange={handleChange}
              className={`${inputClass} ${errors.tare_weight_kg ? errorClass : ''}`}
            />
            {errors.tare_weight_kg && (
              <p className="text-xs text-red-500 mt-1">{errors.tare_weight_kg}</p>
            )}
          </div>

          {/* MGW */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              MGW (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="mgw_kg"
              value={safeValue(formData.mgw_kg)}
              onChange={handleChange}
              className={`${inputClass} ${errors.mgw_kg ? errorClass : ''}`}
            />
            {errors.mgw_kg && <p className="text-xs text-red-500 mt-1">{errors.mgw_kg}</p>}
          </div>

          {/* MPL */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              MPL (kg)
            </label>
            <input
              type="number"
              name="mpl_kg"
              value={safeValue(formData.mpl_kg)}
              onChange={handleChange}
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              placeholder="Auto-calculated"
            />
          </div>

          {/* Pump */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Pump <span className="text-red-500">*</span>
            </label>
            <select
              name="pump_type"
              value={safeValue(formData.pump_type)}
              onChange={handleChange}
              className={`${inputClass} ${errors.pump_type ? errorClass : ''}`}
            >
              <option value="">-- Select Pump Status --</option>
              {masterData.pump?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.pump_type && <p className="text-xs text-red-500 mt-1">{errors.pump_type}</p>}
          </div>

          {/* Cabinet */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Cabinet <span className="text-red-500">*</span>
            </label>
            <select
              name="cabinet_type"
              value={safeValue(formData.cabinet_type)}
              onChange={handleChange}
              className={`${inputClass} ${errors.cabinet_type ? errorClass : ''}`}
            >
              <option value="">-- Select Cabinet --</option>
              {masterData.cabinet?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.cabinet_type && (
              <p className="text-xs text-red-500 mt-1">{errors.cabinet_type}</p>
            )}
          </div>

          {/* Frame Type */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Frame Type <span className="text-red-500">*</span>
            </label>
            <select
              name="frame_type"
              value={safeValue(formData.frame_type)}
              onChange={handleChange}
              className={`${inputClass} ${errors.frame_type ? errorClass : ''}`}
            >
              <option value="">-- Select Frame --</option>
              {masterData.frame_type?.map((opt, idx) => (
                <option key={idx} value={getOptValue(opt)}>
                  {getOptLabel(opt)}
                </option>
              ))}
            </select>
            {errors.frame_type && (
              <p className="text-xs text-red-500 mt-1">{errors.frame_type}</p>
            )}
          </div>

          {/* Size */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Size <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="size"
              value={safeValue(formData.size) || '6058 x 2438 x 2591 mm'}
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed ${errors.size ? errorClass : ''}`}
            />
            {errors.size && <p className="text-xs text-red-500 mt-1">{errors.size}</p>}
          </div>

          {/* Remarks */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Remarks</label>
            <input
              type="text"
              name="remark"
              value={safeValue(formData.remark)}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Color Body/Frame */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Color – Body /Frame</label>
            <input
              type="text"
              name="color_body_frame"
              value={safeValue(formData.color_body_frame)}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Evacuation Valve */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Evacuation Valve Type</label>
            <input
              type="text"
              name="evacuation_valve"
              value={safeValue(formData.evacuation_valve)}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Tank Number Image */}
          <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-2">
            <label className="mb-1 text-sm font-medium text-gray-700">Tank Number Image</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData((prev) => ({ ...prev, _imageFile: e.target.files[0] }));
                  }
                }}
                className={`${inputClass} max-w-md`}
              />
              {formData.tank_number_image_path && (
                <Button
                  type="button"
                  onClick={() => setViewingImage({ url: getUploadUrl(formData.tank_number_image_path), title: 'Tank Number Image' })}
                  size="sm"
                  icon={Eye}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  View
                </Button>
              )}
            </div>
          </div>

          {/* Remarks 2 */}
          <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-2">
            <label className="mb-1 text-sm font-medium text-gray-700">Remarks 2</label>
            <input
              type="text"
              name="remark2"
              value={safeValue(formData.remark2)}
              onChange={handleChange}
              className={inputClass}
              placeholder="Second remarks field"
            />
          </div>

          {/* Select Regulations */}
          <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Select Regulations
            </label>
            <MultiSelect
              options={(Array.isArray(masterData.regulations) ? masterData.regulations : [])?.map((reg) => ({
                label: reg.regulation_name,
                value: String(reg.id),
              }))}
              height="h-24"
              value={formData.regulations.map(String)}
              onChange={(val) => handleMultiChange('regulations', val.map(v => parseInt(v, 10)))}
              placeholder="Select applicable regulations..."
            />
            <p className="text-xs text-gray-400 mt-1">* Click items to select/deselect them.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 mt-6 border-t space-x-3">
        <Button
          onClick={onClose}
          className="bg-[#6B7280] text-white hover:bg-[#4B5563] rounded-lg px-6 py-2.5 font-normal shadow-md"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-[#54737E] text-white hover:bg-[#47656e] rounded-lg px-6 py-2.5 font-normal shadow-md flex items-center"
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
        </Button>
      </div>


      {/* Image Viewer Modal */}
      {
        viewingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{viewingImage.title || 'View Image'}</h3>
                <Button onClick={() => setViewingImage(null)} className="bg-red-500 text-white hover:bg-red-600">Close</Button>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={viewingImage.url}
                  alt={viewingImage.title}
                  className="max-w-xl max-h-[60vh] object-contain border rounded-md"
                />
                <a
                  href={viewingImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
