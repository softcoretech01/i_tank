import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Search, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

// Custom Toggle Component
const StatusToggle = ({ active, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-300'
      }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${active ? 'translate-x-7' : 'translate-x-1'
        }`}
    />
  </button>
);

export default function RegulationsMasterPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchBy, setSearchBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchRegulations = async () => {
    setLoading(true);
    try {
      const resp = await api.get('regulations-master/');
      if (resp.data.success) {
        setItems(resp.data.data);
      }
    } catch (err) {
      console.error("Error fetching regulations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegulations();
  }, []);

  const sortedItems = useMemo(() => {
    let filtered = Array.isArray(items) ? [...items] : [];
    if (filterTerm) {
      filtered = filtered.filter(item =>
        (item.regulation_name && item.regulation_name.toLowerCase().includes(filterTerm.toLowerCase())) ||
        (item.id && item.id.toString().includes(filterTerm))
      );
    }
    return filtered.sort((a, b) => a.id - b.id);
  }, [items, filterTerm]);

  const handleSearch = () => {
    setFilterTerm(searchTerm);
  };

  const handleShowAll = () => {
    setSearchTerm('');
    setFilterTerm('');
  };

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      alert('Please enter a value to add.');
      return;
    }
    try {
      const resp = await api.post('regulations-master/', { regulation_name: trimmed });
      if (resp.data.success) {
        setNewValue('');
        fetchRegulations();
      } else {
        alert(resp.data.message || 'Error creating record');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Server error');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingValue(item.regulation_name);
  };

  const handleSaveEdit = async () => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    try {
      const resp = await api.put(`regulations-master/${editingId}`, { regulation_name: trimmed });
      if (resp.data.success) {
        setEditingId(null);
        setEditingValue('');
        fetchRegulations();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Server error');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 1 ? 0 : 1;
    try {
      const resp = await api.put(`regulations-master/${item.id}`, { status: newStatus });
      if (resp.data.success) {
        fetchRegulations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    alert('Exporting to Excel...');
  };

  return (
    <div className="flex flex-col flex-1 p-3 bg-gray-50 overflow-hidden h-full">
      <div className="bg-white rounded shadow-sm overflow-hidden flex flex-col h-full border border-gray-200">

        {/* Header Section */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-[#546E7A]">Regulations Master</h1>
          </div>

          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold text-gray-700 min-w-[80px]">Search by</span>

              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="h-10 px-3 text-base border border-gray-300 rounded focus:border-[#546E7A] focus:outline-none bg-white min-w-[180px]"
              >
                <option value="name">Regulation Name</option>
                <option value="id">ID</option>
              </select>

              <div className="relative flex-grow max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-10 w-full pl-10 pr-3 py-1 text-base border border-gray-300 rounded focus:border-[#546E7A] focus:outline-none"
                />
              </div>

              <Button
                onClick={handleSearch}
                variant="secondary"
                icon={Search}
                className="h-10 px-5 text-sm bg-[#455A64] hover:bg-[#37474F] font-bold border-none"
              >
                Search
              </Button>

              <Button
                onClick={handleShowAll}
                variant="secondary"
                icon={RotateCcw}
                className="h-10 px-5 text-sm bg-[#455A64] hover:bg-[#37474F] font-bold border-none"
              >
                Show All
              </Button>

              <Button
                onClick={handleExport}
                variant="primary"
                icon={FileSpreadsheet}
                className="h-10 px-5 text-sm bg-[#2E7D32] hover:bg-[#1B5E20] font-bold border-none"
              >
                Export to Excel
              </Button>
            </div>

            {/* Add Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold text-gray-700 min-w-[80px]">Add Regulation</span>
              <div className="flex-grow max-w-xs">
                <input
                  type="text"
                  placeholder="Enter Regulation to add..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="h-10 w-full px-4 py-1 text-base border border-gray-300 rounded focus:border-[#546E7A] focus:outline-none"
                />
              </div>
              <Button
                onClick={handleAdd}
                variant="primary"
                icon={Plus}
                className="h-10 px-5 text-sm bg-[#2E7D32] hover:bg-[#1B5E20] font-bold border-none"
              >
                Add Regulation
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Table */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#455A64] text-white shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-b border-[#37474F] w-20">ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-b border-[#37474F]">Regulation Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-b border-[#37474F]">Created By</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-b border-[#37474F]">Created At</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider border-b border-[#37474F] w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-base text-gray-400 italic">Loading...</td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-base text-gray-400 italic bg-white">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-base font-medium text-gray-500">{item.id}</td>
                    <td className="px-6 py-3 text-base text-gray-800">
                      {editingId === item.id ? (
                        <input
                          className="w-full border border-blue-400 rounded px-3 py-1 text-base focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        item.regulation_name
                      )}
                    </td>
                    <td className="px-6 py-3 text-base text-gray-600">{item.created_by || 'System'}</td>
                    <td className="px-6 py-3 text-base text-gray-600">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end items-center gap-4">
                        {editingId === item.id ? (
                          <>
                            <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Save">
                              <Save className="w-5 h-5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:bg-gray-50 rounded" title="Cancel">
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                              <Edit className="w-5 h-5" />
                            </button>
                            <StatusToggle active={item.status === 1} onToggle={() => handleToggleStatus(item)} />
                          </>
                        )}
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