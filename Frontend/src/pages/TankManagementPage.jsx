import React, { useState, useEffect } from 'react';
import { Plus, Edit, FileSpreadsheet, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { getTanks, updateTank } from '../services/tankService';
import AddTankModal from '../components/tank-modal/AddTankModal';
import api from '../services/api';

export default function TankManagementPage() {
  const [tanks, setTanks] = useState([]);
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL State Management
  const [searchParams, setSearchParams] = useSearchParams();
  const showModal = searchParams.has('modal');
  const editingTankId = searchParams.get('id') ? parseInt(searchParams.get('id')) : null;

  // Search State
  const [searchField, setSearchField] = useState('tank_number');
  const [searchText, setSearchText] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // --- Data Loading ---
  const loadTanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTanks();
      setTanks(data);
      setFilteredTanks(data);
    } catch (err) {
      setError('Failed to load tanks.');
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => { loadTanks(); }, []);

  // --- Real-time Search Logic ---
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredTanks(tanks);
      return;
    }

    const lowerText = searchText.toLowerCase();
    const filtered = tanks.filter(tank => {
      const value = String(tank[searchField] || '').toLowerCase();
      return value.includes(lowerText);
    });

    setFilteredTanks(filtered);
    setCurrentPage(1);
  }, [searchText, searchField, tanks]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTanks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTanks.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // --- Handlers ---
  const handleSaveSuccess = () => { loadTanks(); };

  // --- Format helpers ---
  const formatMawp = (val) => {
    if (val === null || val === undefined) return '-';
    const s = String(val).trim();
    if (s === '') return '-';
    // If already contains unit like 'bar' (case-insensitive), return as-is
    if (/bar\b/i.test(s)) return s;
    // If purely numeric, append ' bar'
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return `${s} bar`;
    // Otherwise return unchanged
    return s;
  };

  const formatDesignTemp = (val) => {
    if (!val && val !== 0) return '-';
    // Replace occurrences like ' C' with the degree symbol + C
    try {
      return String(val).replace(/ ?C\b/g, '°C');
    } catch (e) {
      return String(val);
    }
  };

  const handleStatusToggle = async (tank) => {
    const newStatus = tank.status === 'active' ? 'inactive' : 'active';

    // Optimistic update
    const updatedTanks = tanks.map(t =>
      t.id === tank.id ? { ...t, status: newStatus } : t
    );
    setTanks(updatedTanks);

    try {
      await updateTank(tank.id, { status: newStatus });
    } catch (err) {
      alert("Failed to update status.");
      loadTanks();
    }
  };

  const handleEditClick = (tankId) => {
    setSearchParams({ modal: 'edit', id: tankId, tab: 'tank' });
  };

  const handleAddClick = () => {
    setSearchParams({ modal: 'new', tab: 'tank' });
  };

  const handleCloseModal = () => {
    setSearchParams({}); // Clear params to close modal
    loadTanks();
  };

  // --- FIX: Use 'api' instance to handle dynamic Base URL ---
  const handleExport = async () => {
    try {
      const response = await api.get('/tanks/export-to-excel', {
        responseType: 'blob', // Important for binary file download
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = "Tank_Master_Excel.xlsx";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export Excel file.");
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  return (
    <>
      <AddTankModal
        show={showModal}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        tankId={editingTankId}
      />

      <div className="flex flex-col bg-gray-50 font-sans min-h-max min-w-max">
        {/* --- 1. Top Header --- */}
        <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200 sticky left-0 right-0 w-full z-20">
          <h1 className="text-2xl font-bold text-[#546E7A]">Tank Master</h1>
          <div className="flex gap-3">
            <Button
              variant="primary"
              icon={FileSpreadsheet}
              className="bg-[#529085] hover:bg-[#437a70] text-white font-medium px-4 py-2 rounded shadow-sm border border-transparent"
              onClick={handleExport}
            >
              Export to Excel
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              className="bg-[#546E7A] hover:bg-[#455A64] text-white font-medium px-4 py-2 rounded shadow-sm border border-transparent"
              onClick={handleAddClick}
            >
              Add Tank
            </Button>
          </div>
        </header>

        {/* --- 2. Search Section --- */}
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-600 mb-2">Search by</label>
              <div className="relative">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option value="tank_number">Tank Number</option>
                  <option value="mfgr">MFGR</option>
                  <option value="capacity_l">Capacity (L)</option>
                  <option value="mawp">MAWP</option>
                  {/* Added Owner to Search */}
                  <option value="owner">Owner</option>
                  <option value="cabinet_type">Cabinet</option>
                  <option value="design_temperature">Design Temperature</option>
                  <option value="status">Status</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex-grow relative">
              <label className="block text-sm font-medium text-gray-600 mb-1 invisible">Search</label>
              <div className="absolute inset-y-0 left-0 pl-3 pt-6 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchText && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 pt-6 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- 3. Table Section --- */}
        <main className="flex-grow px-8 pb-8">
          {error && <div className="p-4 mb-4 text-red-600 bg-red-50 border-l-4 border-red-500">{error}</div>}

          <div className="w-full bg-white rounded-lg border-2 border-[#546E7A] flex flex-col shadow-md">

            <div>
              <table className="w-full min-w-full">
                <thead className="bg-[#546E7A] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider w-16 border-r border-[#607D8B]">S.No</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Tank Number</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">MFGR</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Capacity (L)</th>

                    {/* MAWP and Owner columns (fixed order) */}
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">MAWP</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Owner</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Cabinet</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Design Temp</th>
                    {/* Removed Body/Frame Colour Header Here */}
                    <th className="px-6 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border-r border-[#607D8B]">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-white uppercase tracking-wider">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="10" className="p-8 text-center text-gray-500">Loading data...</td></tr>
                  ) : filteredTanks.length === 0 ? (
                    <tr><td colSpan="10" className="p-8 text-center text-gray-500">No tanks found.</td></tr>
                  ) : (
                    currentItems.map((tank, index) => {
                      const isInactive = tank.status !== 'active';

                      return (
                        <tr key={tank.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indexOfFirstItem + index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tank.tank_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tank.mfgr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tank.capacity_l}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatMawp(tank.mawp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tank.owner || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tank.cabinet_type || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDesignTemp(tank.design_temperature)}</td>
                          {/* Removed Body/Frame Colour Data Cell Here */}

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-md ${tank.status === 'active'
                              ? 'bg-[#48BB78] text-white'
                              : 'bg-red-500 text-white'
                              }`}>
                              {tank.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-4">
                              <button
                                onClick={() => handleEditClick(tank.id)}
                                disabled={isInactive}
                                className={`transition-colors ${isInactive
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                title={isInactive ? "Activate tank to edit" : "Edit Details"}
                              >
                                <Edit className="w-5 h-5" />
                              </button>

                              <ToggleSwitch
                                checked={tank.status === 'active'}
                                onChange={() => handleStatusToggle(tank)}
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

          {/* Pagination Controls */}
          {filteredTanks.length > 0 && totalPages > 1 && (
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
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredTanks.length)}</span> of{' '}
                    <span className="font-medium">{filteredTanks.length}</span> results
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
        </main>
      </div>
    </>
  );
}