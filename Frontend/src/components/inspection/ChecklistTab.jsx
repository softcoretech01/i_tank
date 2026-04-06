import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, HelpCircle, Save, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { getChecklistTemplate, saveChecklist, getInspectionReview, createChecklist, getMarkedImages } from '../../services/inspectionService';

const statusOptions = [
    { id: 1, label: 'OK', color: 'bg-green-500', border: 'border-green-500' },
    { id: 2, label: 'Faulty', color: 'bg-red-500', border: 'border-red-500' },
    { id: 3, label: 'NA', color: 'bg-gray-300', border: 'border-gray-300' },
];

export default function ChecklistTab({ inspectionId, tankId, onFaultyDetected, onNext, mode }) {
    const [sections, setSections] = useState([]);
    const [initialSections, setInitialSections] = useState([]); // Store initial state for cancel
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isExisting, setIsExisting] = useState(false);
    const [markedImages, setMarkedImages] = useState([]);

    useEffect(() => {
        const loadChecklistData = async () => {
            try {
                const [templateRes, existingRes] = await Promise.all([
                    getChecklistTemplate(),
                    inspectionId ? getInspectionReview(inspectionId) : Promise.resolve(null)
                ]);

                // Create a map for existing statuses/comments
                const existingMap = {};
                let foundFaulty = false;
                let hasExisting = false;
                if (existingRes && existingRes.success && existingRes.data.inspection_checklist) {
                    existingRes.data.inspection_checklist.forEach(job => {
                        hasExisting = true;
                        job.items.forEach(item => {
                            existingMap[item.sub_job_id] = { 
                                status_id: item.status_id, 
                                comment: item.comment,
                                image_id_assigned: item.image_id_assigned
                            };
                            if (item.status_id === 2) foundFaulty = true;
                        });
                    });
                }

                setIsExisting(hasExisting);

                const initialized = (templateRes.data.sections || []).map(section => ({
                    ...section,
                    items: (section.items || []).map(item => {
                        const existing = existingMap[item.sub_job_id];
                        return {
                            ...item,
                            status_id: existing ? existing.status_id : 1, // Default to OK if no existing
                            comments: existing ? (existing.comment || '') : '',
                            image_id_assigned: existing ? (existing.image_id_assigned || '') : ''
                        };
                    })
                }));

                setSections(initialized);
                setInitialSections(JSON.parse(JSON.stringify(initialized))); // Deep copy
                if (foundFaulty) onFaultyDetected(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        const loadMarkedImages = async () => {
            if (inspectionId) {
                try {
                    const res = await getMarkedImages(inspectionId);
                    if (res.success) setMarkedImages(res.data || []);
                } catch (err) {
                    console.error("Error loading marked images:", err);
                }
            }
        };

        loadChecklistData();
        loadMarkedImages();
    }, [inspectionId]);

    const handleStatusChange = (sectionId, subJobId, statusId) => {
        setSections(prev => prev.map(section => {
            if (section.job_id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item =>
                        item.sub_job_id === subJobId ? { ...item, status_id: statusId } : item
                    )
                };
            }
            return section;
        }));
    };

    const handleCommentChange = (sectionId, subJobId, comment) => {
        setSections(prev => prev.map(section => {
            if (section.job_id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item =>
                        item.sub_job_id === subJobId ? { ...item, comments: comment } : item
                    )
                };
            }
            return section;
        }));
    };

    const handleImageToggle = (sectionId, subJobId, imageId) => {
        setSections(prev => prev.map(section => {
            if (section.job_id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item => {
                        if (item.sub_job_id === subJobId) {
                            const currentStr = String(item.image_id_assigned || '');
                            const current = currentStr ? currentStr.split(',').filter(Boolean) : [];
                            const next = current.includes(String(imageId))
                                ? current.filter(id => id !== String(imageId))
                                : [...current, String(imageId)];
                            return { ...item, image_id_assigned: next.join(',') };
                        }
                        return item;
                    })
                };
            }
            return section;
        }));
    };

    const navigate = useNavigate();

    const handleCancel = () => {
        navigate('/inspection');
    };

    const handleSave = async () => {
        // Check if any faulty item missing comment
        let missingComment = false;
        let hasFaulty = false;
        sections.forEach(s => {
            s.items.forEach(i => {
                if (i.status_id === 2) {
                    hasFaulty = true;
                    if (!i.comments.trim()) missingComment = true;
                }
            });
        });

        if (missingComment) {
            alert("Please provide comments for all faulty items.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                inspection_id: inspectionId,
                tank_id: tankId,
                sections: sections
            };
            if (isExisting) {
                await saveChecklist(payload);
            } else {
                await createChecklist(payload);
            }
            // Update initial sections to current state on success
            setInitialSections(JSON.parse(JSON.stringify(sections)));
            onFaultyDetected(hasFaulty);
            onNext(hasFaulty);
        } catch (err) {
            console.error(err);
            alert("Failed to save checklist.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading checklist...</div>;

    return (
        <div className="space-y-4">
            {sections.map((section) => (
                <div key={section.job_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${section.items.some(item => item.status_id === 2) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <h3 className="font-bold text-[#546E7A] uppercase tracking-wide text-lg">{section.title}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {section.items.map((item) => (
                            <div key={item.sub_job_id} className="p-3 transition-colors hover:bg-gray-50/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <span className="text-base font-bold text-gray-400 mt-1 w-8">{item.sn}</span>
                                            <p className="text-lg font-medium text-gray-700 leading-relaxed">{item.title}</p>
                                        </div>
                                    </div>

                                    {/* Status Dot */}
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => {
                                                const current = item.status_id;
                                                const next = current === 1 ? 2 : current === 2 ? 3 : 1;
                                                handleStatusChange(section.job_id, item.sub_job_id, next);
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${statusOptions.find(opt => opt.id === item.status_id)?.color} ${statusOptions.find(opt => opt.id === item.status_id)?.border}`}
                                        ></button>
                                    </div>
                                </div>

                                {/* Comment Box for Faulty items */}
                                {item.status_id === 2 && (
                                    <div className="mt-2 ml-11">
                                        <textarea
                                            placeholder="Describe the fault here..."
                                            value={item.comments}
                                            onChange={(e) => handleCommentChange(section.job_id, item.sub_job_id, e.target.value)}
                                            className="w-full p-3 text-lg border border-red-200 rounded-lg bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                                            rows="2"
                                        />
                                        
                                        {/* Marked Images Selection */}
                                        {markedImages.length > 0 && (
                                            <div className="mt-3 p-3 bg-white border border-red-100 rounded-lg shadow-sm">
                                                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-tight">Assign Marked Photos:</p>
                                                <div className="flex flex-wrap gap-4">
                                                    {markedImages.map((img) => {
                                                        const imgIdStr = String(img.image_id);
                                                        const currentItemAssignedStr = String(item.image_id_assigned || '');
                                                        const currentItemAssigned = currentItemAssignedStr.split(',').filter(Boolean).includes(imgIdStr);
                                                        
                                                        // Check if this image is assigned to any OTHER item in the entire checklist
                                                        const isAssignedElsewhere = sections.some(s => 
                                                            (s.items || []).some(otherItem => 
                                                                String(otherItem.sub_job_id) !== String(item.sub_job_id) && 
                                                                String(otherItem.image_id_assigned || '').split(',').filter(Boolean).includes(imgIdStr)
                                                            )
                                                        );

                                                        // Hide if assigned elsewhere
                                                        if (isAssignedElsewhere) return null;

                                                        return (
                                                            <label key={img.image_id} className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={currentItemAssigned}
                                                                    onChange={() => handleImageToggle(section.job_id, item.sub_job_id, img.image_id)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                                                />
                                                                <span className={`text-sm font-medium transition-colors ${currentItemAssigned ? 'text-red-700 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                                                    {img.image_name}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button
                    onClick={handleCancel}
                    variant="secondary"
                    icon={RotateCcw}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-3 rounded-xl shadow-sm text-lg font-bold uppercase"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="primary"
                    icon={Check}
                    isLoading={isSaving}
                    className="bg-[#48BB78] hover:bg-[#38A169] text-white px-10 py-3 rounded-xl shadow-lg shadow-green-200 text-lg font-bold uppercase"
                >
                    {mode === 'ADD' ? 'Save & Next' : 'Update'}
                </Button>
            </div>
        </div>
    );
}
