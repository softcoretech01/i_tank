import React, { useMemo, useState } from 'react';
import { Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';

const getNextId = (items) => (items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1);

export default function MasterCrudPage({ title, fieldLabel, initialData = [] }) {
  const [items, setItems] = useState(initialData);
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.id - b.id), [items]);

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    setItems([...items, { id: getNextId(items), name: trimmed }]);
    setNewValue('');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingValue(item.name);
  };

  const handleSaveEdit = () => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    setItems(items.map((item) => (item.id === editingId ? { ...item, name: trimmed } : item)));
    setEditingId(null);
    setEditingValue('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this item?')) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4">
      <header className="p-4 mb-4 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-[#546E7A]">{title}</h1>
      </header>

      <section className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 sm:col-span-10">
            <FormInput
              label={`Add ${fieldLabel}`}
              id={`${fieldLabel}-new`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter ${fieldLabel}`}
            />
          </div>
          <div className="col-span-12 sm:col-span-2">
            <Button onClick={handleAdd} icon={Plus} variant="primary" className="w-full">
              Add
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#546E7A] text-white">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">{fieldLabel}</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {editingId === item.id ? (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === item.id ? (
                        <>
                          <Button onClick={handleSaveEdit} size="sm" icon={Save} />
                          <Button onClick={() => setEditingId(null)} size="sm" icon={X} />
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(item)} size="sm" icon={Edit} />
                          <Button onClick={() => handleDelete(item.id)} size="sm" icon={Trash2} variant="danger" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
