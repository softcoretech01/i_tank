import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import {
  getMasterCargos, createMasterCargo, updateMasterCargo, deleteMasterCargo
} from '../services/cargoService';

export default function CargoMasterPage() {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMasterCargos();
      setCargos(data);
    } catch (error) { alert('Failed to load cargo master list'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createMasterCargo(newName);
    setNewName('');
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteMasterCargo(id);
      loadData();
    }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditName(c.cargo_reference); };
  const saveEdit = async () => { await updateMasterCargo(editingId, editName); setEditingId(null); loadData(); };

  return (
    <div className="flex flex-col flex-1 min-w-max min-h-max bg-gray-50 font-sans">
      <header className="flex items-center justify-between p-4 m-4 bg-white rounded-lg shadow-sm border-b border-gray-200">
        <h1 className="text-3xl font-bold text-[#546E7A]">Cargo Master</h1>
      </header>

      <main className="flex-grow px-8 pb-8">
        <div className="w-full mx-auto bg-white rounded-lg shadow-lg border-2 border-[#546E7A] flex flex-col">
          <div className="p-6 bg-gray-50 border-b border-[#546E7A]">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Cargo Type</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-grow">
                <FormInput label="Cargo Name" id="new_cargo" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Liquid Hydrogen" />
              </div>
              <div className="pb-1"><Button onClick={handleAdd} variant="primary" icon={Plus}>Add</Button></div>
            </div>
          </div>

          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase w-full">Cargo Reference</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargos.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {editingId === c.id ? (
                      <input className="border rounded px-2 py-1 w-full" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : c.cargo_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {editingId === c.id ? (
                        <>
                          <Button onClick={saveEdit} variant="primary" size="sm" icon={Save} />
                          <Button onClick={() => setEditingId(null)} variant="secondary" size="sm" icon={X} />
                        </>
                      ) : (
                        <>
                          <Button onClick={() => startEdit(c)} variant="outline" size="sm" icon={Edit} />
                          <Button onClick={() => handleDelete(c.id)} variant="danger" size="sm" icon={Trash2} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}