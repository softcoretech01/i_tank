import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { getFlaggedItems, updateToDoItems } from '../../services/inspectionService';

const statusOptions = [
    { id: 1, label: 'Fixed / OK', color: 'bg-green-500', border: 'border-green-500' },
    { id: 2, label: 'Still Faulty', color: 'bg-red-500', border: 'border-red-500' },
    { id: 3, label: 'NA', color: 'bg-gray-300', border: 'border-gray-300' },
];

export default function ToDoListTab({ inspectionId, onNext, mode }) {
    const [todoData, setTodoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadFlagged = async () => {
            try {
                const res = await getFlaggedItems(inspectionId);
                setTodoData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (inspectionId) loadFlagged();
    }, [inspectionId]);

    const handleStatusChange = (sectionIndex, itemIndex, statusId) => {
        const newData = { ...todoData };
        newData.sections[sectionIndex].items[itemIndex].status_id = statusId;
        setTodoData(newData);
    };

    const handleCommentChange = (sectionIndex, itemIndex, comment) => {
        const newData = { ...todoData };
        newData.sections[sectionIndex].items[itemIndex].comment = comment;
        setTodoData(newData);
    };

    const handleSave = async () => {
        // Check if any still faulty
        let hasFaulty = false;
        todoData.sections.forEach(s => {
            s.items.forEach(i => {
                if (i.status_id === 2) hasFaulty = true;
            });
        });

        if (hasFaulty) {
            alert("Please resolve all faulty items before proceeding.");
            return;
        }

        setIsSaving(true);
        try {
            await updateToDoItems(todoData);
            alert("To-do list updated!");
            onNext();
        } catch (err) {
            console.error(err);
            alert("Failed to update to-do list.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading to-do items...</div>;
    if (!todoData || !todoData.sections?.length) return (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
            <p className="text-xl font-medium">No faulty items found. You can proceed to Review.</p>
            <Button onClick={onNext} className="mt-6 bg-[#48BB78] text-white">Continue to Review</Button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                    <h4 className="text-base font-bold text-orange-800">Resolution Required</h4>
                    <p className="text-sm text-orange-600 mt-1">Please update the status of these flagged items before final submission.</p>
                </div>
            </div>

            {todoData.sections.map((section, sIdx) => (
                <div key={section.job_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-[#546E7A] uppercase tracking-wide text-base">{section.title}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {section.items.map((item, iIdx) => (
                            <div key={item.sn} className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded uppercase mt-1">Fault</span>
                                            <div>
                                                <p className="text-base font-bold text-gray-800">{item.title}</p>
                                                <p className="text-sm text-gray-400 mt-1">Original SN: {item.sn}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Update Comment / Action Taken</label>
                                            <textarea
                                                value={item.comment || ''}
                                                onChange={(e) => handleCommentChange(sIdx, iIdx, e.target.value)}
                                                className="w-full p-3 text-base border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-mono"
                                                rows="2"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => {
                                                const current = item.status_id;
                                                const next = current === 1 ? 2 : current === 2 ? 3 : 1;
                                                handleStatusChange(sIdx, iIdx, next);
                                            }}
                                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${statusOptions.find(opt => opt.id === item.status_id)?.color} ${statusOptions.find(opt => opt.id === item.status_id)?.border}`}
                                        ></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-end gap-3 pt-8 border-t border-gray-100">
                <Button
                    onClick={() => navigate('/inspection')}
                    variant="secondary"
                    icon={RotateCcw}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-3 rounded-xl shadow-sm text-lg font-bold uppercase"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="primary"
                    icon={Save}
                    isLoading={isSaving}
                    className="bg-[#D69E2E] hover:bg-[#B7791F] text-white px-10 py-3 rounded-xl shadow-lg shadow-yellow-100"
                >
                    {mode === 'ADD' ? 'Save & Continue' : 'Update & Continue'}
                </Button>
            </div>
        </div>
    );
}
