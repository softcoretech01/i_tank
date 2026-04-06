import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, FileSpreadsheet, Search, X, Eye, FileText, Download, Printer, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { getAllInspections, getInspectionHistory, exportInspectionsToExcel } from '../../services/inspectionService';
import api from '../../services/api';

export default function InspectionListTab({ onAddClick, onEditClick, onViewClick, onHistoryClick }) {
    const [inspections, setInspections] = useState([]);
    const [filteredInspections, setFilteredInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // History State
    const [historyData, setHistoryData] = useState([]);
    const [filteredHistoryData, setFilteredHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('current');

    // Search State
    const [searchField, setSearchField] = useState('report_number');
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Copy State
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [inspectionTypes, setInspectionTypes] = useState([]);

    const handleSearch = () => {
        if (!searchText.trim()) {
            if (activeTab === 'current') {
                setFilteredInspections(inspections);
                setCurrentPage(1);
            } else {
                setFilteredHistoryData(historyData);
                setHistoryCurrentPage(1);
            }
            return;
        }
        const lowerText = searchText.toLowerCase();

        if (activeTab === 'current') {
            const filtered = inspections.filter(item => {
                const value = String(item[searchField] || '').toLowerCase();
                return value.includes(lowerText);
            });
            setFilteredInspections(filtered);
            setCurrentPage(1);
        } else {
            const filtered = historyData.filter(item => {
                const value = String(item[searchField] || '').toLowerCase();
                return value.includes(lowerText);
            });
            setFilteredHistoryData(filtered);
            setHistoryCurrentPage(1);
        }
    };

    const loadInspectionTypes = async () => {
        try {
            const res = await api.get('/tank_inspection_checklist/masters');
            if (res.data && res.data.data && res.data.data.inspection_types) {
                setInspectionTypes(res.data.data.inspection_types);
            }
        } catch (err) {
            console.error("Failed to load inspection types", err);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getAllInspections();
            const allInspections = Array.isArray(res.data) ? res.data : [];

            // Load history to filter out completed inspections
            const historyRes = await getInspectionHistory();
            const historyInspections = Array.isArray(historyRes.data) ? historyRes.data : [];
            const historyInspectionIds = new Set(historyInspections.map(h => h.inspection_id));

            // Filter out inspections that are in history
            const currentInspections = allInspections.filter(inspection => !historyInspectionIds.has(inspection.inspection_id));

            setInspections(currentInspections);
            setFilteredInspections(currentInspections);
            setHistoryData(historyInspections);
            setFilteredHistoryData(historyInspections);
            setCurrentPage(1);
            setHistoryCurrentPage(1);
        } catch (err) {
            setError('Failed to load inspections.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        loadInspectionTypes();
    }, []);

    const handleExport = async () => {
        try {
            const response = await exportInspectionsToExcel();

            // Try to get filename from content-disposition header
            let fileName = `Inspection_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename=(.+)/);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;

            // Mark as downloading to prevent `beforeunload` auth logout
            window.isDownloading = true;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setTimeout(() => {
                window.isDownloading = false;
            }, 1000);
        } catch (err) {
            console.error("Export Error:", err);
            alert("Failed to export Excel file.");
        }
    };

    const handleCopyClick = (item) => {
        setSelectedInspection(item);
        setShowCopyModal(true);
        setSelectedType(null);
    };

    const confirmCopy = async () => {
        if (!selectedType || !selectedInspection) return;

        try {
            const res = await api.post(`/tank_inspection_checklist/copy/${selectedInspection.inspection_id}?new_type_id=${selectedType}`);
            if (res.data.success) {
                alert(`Inspection copied! New Report: ${res.data.data.new_report_number}`);
                setShowCopyModal(false);
                loadData(); // Refresh list
            } else {
                alert("Failed to copy inspection.");
            }
        } catch (err) {
            console.error("Copy error", err);
            alert("Error copying inspection.");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Pagination Calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInspectionsItems = filteredInspections.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);

    const indexOfLastHistoryItem = historyCurrentPage * itemsPerPage;
    const indexOfFirstHistoryItem = indexOfLastHistoryItem - itemsPerPage;
    const currentHistoryItems = filteredHistoryData.slice(indexOfFirstHistoryItem, indexOfLastHistoryItem);
    const totalHistoryPages = Math.ceil(filteredHistoryData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    const handleHistoryPageChange = (pageNumber) => setHistoryCurrentPage(pageNumber);

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 min-w-max">
            {/* Header Section */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100">
                <h1 className="text-3xl font-bold text-[#546E7A]">Inspection Report</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('current'); setCurrentPage(1); }}
                    className={`px-6 py-3 font-medium text-base border-b-2 transition-colors ${activeTab === 'current'
                        ? 'border-[#546E7A] text-[#546E7A]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Current Inspections ({filteredInspections.length})
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setHistoryCurrentPage(1); }}
                    className={`px-6 py-3 font-medium text-base border-b-2 transition-colors ${activeTab === 'history'
                        ? 'border-[#546E7A] text-[#546E7A]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    History ({filteredHistoryData.length})
                </button>
            </div>

            {/* Search Section */}
            <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-48">
                        <label className="block text-base font-medium text-gray-600 mb-2">Search by</label>
                        <select
                            value={searchField}
                            onChange={(e) => setSearchField(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="report_number">Report Number</option>
                            <option value="tank_number">Tank Number</option>
                            <option value="inspection_type_name">Inspection Type</option>
                            {activeTab === 'current' && <option value="mfgr">MFGR</option>}
                            <option value="status_name">Status</option>
                        </select>
                    </div>

                    <div className="w-full md:w-64 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Type to search..."
                            className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {searchText && (
                            <button
                                onClick={() => setSearchText('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={Search}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded shadow-sm"
                            onClick={handleSearch}
                        >
                            Search
                        </Button>

                        <Button
                            variant="secondary"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded shadow-sm"
                            onClick={() => {
                                setSearchText('');
                                if (activeTab === 'current') {
                                    setFilteredInspections(inspections);
                                    setCurrentPage(1);
                                } else {
                                    setFilteredHistoryData(historyData);
                                    setHistoryCurrentPage(1);
                                }
                            }}
                        >
                            Show All
                        </Button>

                        {activeTab === 'current' && (
                            <>
                                <Button
                                    variant="primary"
                                    icon={FileSpreadsheet}
                                    className="bg-[#529085] hover:bg-[#437a70] text-white font-medium px-4 py-2 rounded shadow-sm"
                                    onClick={handleExport}
                                >
                                    Export to Excel
                                </Button>

                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    className="bg-[#48BB78] hover:bg-[#38A169] text-white font-medium px-4 py-2 rounded shadow-sm"
                                    onClick={onAddClick}
                                >
                                    Add Inspection
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Current Inspections Tab */}
            {activeTab === 'current' && (
                <div className="p-2">
                    {error && <div className="p-4 mb-4 text-red-600 bg-red-50 border-l-4 border-red-500 rounded">{error}</div>}

                    <div className="border-2 border-[#546E7A] rounded-lg shadow-md bg-white flex flex-col">
                        <div>
                            <table className="w-full">
                                <thead className="bg-[#546E7A] text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">ID</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Inspection Report No</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Tank No</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Status</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Location</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Type</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Safety Valve Brand</th>
                                        <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Product</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Operator Submission</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Web Submitted</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Action</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase border-r border-[#607D8B] whitespace-nowrap">Copy</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase whitespace-nowrap">Print</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan="11" className="p-8 text-center text-gray-500">Loading reports...</td></tr>
                                    ) : filteredInspections.length === 0 ? (
                                        <tr><td colSpan="11" className="p-8 text-center text-gray-500">No reports found.</td></tr>
                                    ) : (
                                        currentInspectionsItems.map((item, index) => (
                                            <tr key={item.inspection_id} className="hover:bg-gray-50 transition-colors whitespace-nowrap">
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{indexOfFirstItem + index + 1}</td>
                                                <td className="px-4 py-2 text-base font-bold border-r border-gray-100">
                                                    <button
                                                        onClick={() => onViewClick(item)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline transition-all"
                                                    >
                                                        {item.report_number}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2 text-base font-medium text-gray-800 border-r border-gray-100">{item.tank_number}</td>
                                                <td className="px-4 py-2 text-center border-r border-gray-100">
                                                    <span className={`px-2 py-1 text-xs font-black rounded uppercase ${item.status_name === 'Faulty' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.status_name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-base text-gray-600 border-r border-gray-100">{item.location_name || '-'}</td>
                                                <td className="px-4 py-2 text-base text-gray-600 border-r border-gray-100">{item.inspection_type_name || '-'}</td>
                                                <td className="px-4 py-2 text-base text-gray-600 border-r border-gray-100">{item.safety_valve_brand_name || '-'}</td>
                                                <td className="px-4 py-2 text-base text-gray-600 border-r border-gray-100">{item.product_name || '-'}</td>
                                                <td className="px-4 py-2 text-center border-r border-gray-100">
                                                    <span className={`px-2 py-1 text-xs font-black rounded uppercase ${item.is_submitted === 1 ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}>
                                                        {item.is_submitted === 1 ? 'SUBMITTED' : 'DRAFT'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center border-r border-gray-100">
                                                    {item.web_submitted === 1 && (
                                                        <span className={`px-2 py-1 text-xs font-black rounded uppercase ${item.is_submitted === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                                            {item.is_submitted === 1 ? 'UPDATED' : 'SUBMITTED'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center border-r border-gray-100">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => onViewClick(item)}
                                                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                                            title="View Report"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        {!(sessionStorage.getItem('role_id') === '2' && (item.is_submitted === 1 || item.web_submitted === 1)) && (
                                                            <button
                                                                onClick={() => onEditClick(item)}
                                                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                                title="Edit Details"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center border-r border-gray-100">
                                                    <button
                                                        onClick={() => handleCopyClick(item)}
                                                        className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                                                        title="Copy Inspection"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        disabled={!(item.is_submitted === 1 || item.web_submitted === 1)}
                                                        onClick={() => navigate(`/inspection/print/${item.inspection_id}`)}
                                                        className={`p-1 transition-colors ${(item.is_submitted === 1 || item.web_submitted === 1)
                                                            ? 'text-gray-600 hover:text-gray-900'
                                                            : 'text-gray-300 cursor-not-allowed'
                                                            }`}
                                                        title="Print Report"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls for Current Inspections */}
                    {filteredInspections.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#546E7A] border-t-0 rounded-b-lg">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:grid sm:grid-cols-3 sm:items-center w-full">
                                <div className="text-left">
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredInspections.length)}</span> of{' '}
                                        <span className="font-medium">{filteredInspections.length}</span> results
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            &lt;
                                        </button>
                                        {(() => {
                                            let pages = [];
                                            let maxVisiblePages = 5;
                                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                            if (endPage - startPage + 1 < maxVisiblePages) {
                                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                            }

                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageChange(i)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i
                                                            ? 'z-10 bg-[#546E7A] border-[#546E7A] text-white'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {i}
                                                    </button>
                                                );
                                            }
                                            return pages;
                                        })()}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            &gt;
                                        </button>
                                    </nav>
                                </div>
                                <div></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content - History Tab */}
            {activeTab === 'history' && (
                <div className="p-2">
                    <div className="border-2 border-[#546E7A] rounded-lg shadow-md bg-white flex flex-col">
                        {historyLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Loading history...</p>
                                </div>
                            </div>
                        ) : filteredHistoryData.length === 0 ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="text-center py-8 text-gray-500">
                                    <p>No history records found.</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <table className="w-full">
                                    <thead className="bg-[#546E7A] text-white sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">ID</th>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">Report Number</th>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">Tank Number</th>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">Inspection Type</th>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">Inspection Date</th>
                                            <th className="px-4 py-2 text-left text-sm font-bold text-white uppercase border-r border-[#607D8B]">History Date</th>
                                            <th className="px-4 py-2 text-center text-sm font-bold text-white uppercase">Copy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentHistoryItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{indexOfFirstHistoryItem + index + 1}</td>
                                                <td className="px-4 py-2 text-base font-bold text-gray-900 border-r border-gray-100">
                                                    <button
                                                        onClick={() => onHistoryClick(item)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {item.report_number}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{item.tank_number}</td>
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{item.inspection_type_name || '-'}</td>
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{formatDate(item.inspection_date)}</td>
                                                <td className="px-4 py-2 text-base text-gray-900 border-r border-gray-100">{formatDate(item.history_date)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => handleCopyClick(item)}
                                                        className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                                                        title="Copy Inspection"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls for History */}
                    {filteredHistoryData.length > 0 && totalHistoryPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#546E7A] border-t-0 rounded-b-lg">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handleHistoryPageChange(historyCurrentPage - 1)}
                                    disabled={historyCurrentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handleHistoryPageChange(historyCurrentPage + 1)}
                                    disabled={historyCurrentPage === totalHistoryPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:grid sm:grid-cols-3 sm:items-center w-full">
                                <div className="text-left">
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{indexOfFirstHistoryItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastHistoryItem, filteredHistoryData.length)}</span> of{' '}
                                        <span className="font-medium">{filteredHistoryData.length}</span> results
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handleHistoryPageChange(historyCurrentPage - 1)}
                                            disabled={historyCurrentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            &lt;
                                        </button>
                                        {(() => {
                                            let pages = [];
                                            let maxVisiblePages = 5;
                                            let startPage = Math.max(1, historyCurrentPage - Math.floor(maxVisiblePages / 2));
                                            let endPage = Math.min(totalHistoryPages, startPage + maxVisiblePages - 1);

                                            if (endPage - startPage + 1 < maxVisiblePages) {
                                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                            }

                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => handleHistoryPageChange(i)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${historyCurrentPage === i
                                                            ? 'z-10 bg-[#546E7A] border-[#546E7A] text-white'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {i}
                                                    </button>
                                                );
                                            }
                                            return pages;
                                        })()}
                                        <button
                                            onClick={() => handleHistoryPageChange(historyCurrentPage + 1)}
                                            disabled={historyCurrentPage === totalHistoryPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            &gt;
                                        </button>
                                    </nav>
                                </div>
                                <div></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Copy Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Copy Inspection</h3>
                        <p className="mb-4 text-gray-600">Choose the inspection type for the copied report:</p>

                        <div className="space-y-2 mb-6">
                            {inspectionTypes.map((type) => (
                                <label key={type.inspection_type_id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <input
                                        type="radio"
                                        name="inspectionType"
                                        value={type.inspection_type_id}
                                        checked={selectedType === type.inspection_type_id}
                                        onChange={() => setSelectedType(type.inspection_type_id)}
                                        className="form-radio h-5 w-5 text-blue-600"
                                    />
                                    <span className="text-gray-700">{type.inspection_type_name}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCopy}
                                disabled={!selectedType}
                                className={`px-4 py-2 rounded text-white ${!selectedType ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
