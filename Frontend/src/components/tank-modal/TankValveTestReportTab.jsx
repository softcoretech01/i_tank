import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea.jsx'; 
import { getValveTestReport, saveValveTestReport, deleteValveTestReport } from '../../services/valveTestReportService.js'; 

const initialState = {
    test_date: '',
    inspected_by: '',
    remarks: '',
};

export default function TankValveTestReportTab({ tankId, onClose, onNext }) {
    const [formData, setFormData] = useState(initialState);
    const [reportFile, setReportFile] = useState(null); 
    const [reportsList, setReportsList] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Check if tank is saved before allowing edits
    if (!tankId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
                <AlertCircle className="w-12 h-12 text-orange-500" />
                <p className="text-lg font-medium">Please save the "Tank Basic Details" first.</p>
            </div>
        );
    }

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const reports = await getValveTestReport(tankId); 
            setReportsList(Array.isArray(reports) ? reports : []);
        } catch (err) {
            // Handle 404 (No reports found) gracefully
            if (err.response?.status === 404) {
                 setReportsList([]); 
            } else {
                 console.error(err);
                 setError('Failed to load existing valve test report data.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // ✅ Guard Clause: Only fetch if tankId is valid
        if (tankId && (typeof tankId === 'string' || typeof tankId === 'number')) {
            loadData();
        }
    }, [tankId]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB");
            return;
        }
        setReportFile(file);
    };

    const handleSave = async () => {
        if (!formData.test_date || !formData.inspected_by) {
            alert('Test Date and Inspected By are required.');
            return;
        }

        if (!reportFile) {
            alert('Please upload the Inspection Report file.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('tank_id', tankId);
            data.append('test_date', formData.test_date);
            data.append('inspected_by', formData.inspected_by);
            data.append('remarks', formData.remarks || '');
            data.append('created_by', 'User'); 
            data.append('inspection_report_file', reportFile);

            await saveValveTestReport(data);

            alert('Valve Test Report saved successfully!');
            
            // Reset Form
            setFormData(initialState);
            setReportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            // Refresh List
            await loadData();

            if (onNext) {
                onNext();
            }

        } catch (err) {
            setError('Failed to save report. Please ensure all fields are correct.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this report?")) {
            try {
                await deleteValveTestReport(id);
                loadData();
            } catch (err) {
                alert("Failed to delete report.");
            }
        }
    };

    const handleCancel = () => {
        setFormData(initialState);
        setReportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose(); 
    };

    return (
        <div className="space-y-8">
            {error && <div className="p-3 text-red-800 bg-red-100 border border-red-300 rounded-md">{error}</div>}
            
            {/* --- Form Section --- */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Upload Inspection Report *</label>
                        <p className="text-xs text-gray-500">File size less than 2 MB</p>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept=".pdf, image/*"
                                onChange={handleFileChange} 
                                className="hidden"
                            />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Choose file
                            </Button>
                            <span className="text-sm text-gray-600 truncate flex-grow" title={reportFile ? reportFile.name : ''}>
                                {reportFile ? reportFile.name : 'No file chosen'}
                            </span>
                        </div>
                    </div>

                    <FormInput 
                        label="Test Date" 
                        id="test_date" 
                        type="date" 
                        value={formData.test_date} 
                        onChange={handleChange}
                    />

                    <FormInput 
                        label="Inspected By" 
                        id="inspected_by" 
                        value={formData.inspected_by} 
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <FormTextarea 
                        label="Remarks" 
                        id="remarks" 
                        value={formData.remarks} 
                        onChange={handleChange}
                        rows={4} 
                        placeholder="Add any relevant notes regarding the valve test."
                    />
                </div>

                <div className="flex justify-end pt-2 space-x-3">
                    <Button 
                        onClick={handleCancel} 
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
                        {isSaving ? 'Saving...' : 'Save Report'}
                    </Button>
                </div>
            </div>

            {/* --- Linked Reports List (Table) --- */}
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Linked Valve Test Reports</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#54737E] text-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Test Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Inspected By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Remarks</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">File</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
                            ) : reportsList.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">No reports linked yet.</td></tr>
                            ) : (
                                reportsList.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.test_date || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.inspected_by || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-blue-600 truncate max-w-[150px]">
                                            {item.inspection_report_file ? (
                                                <span className="flex items-center" title={item.inspection_report_file}>
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    File
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
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