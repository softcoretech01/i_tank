import React, { useState, useEffect } from 'react';
import { Eye, Send, CheckCircle2, Download, Package, Info, FileText, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { getInspectionReview, submitInspection, finalizeReview, getCurrentUser } from '../../services/inspectionService';
import { getUploadUrl } from '../../services/api';

export default function ReviewTab({ inspectionId, onSubmitSuccess, readOnly = false, isPrintMode = false, mode }) {
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationIssues, setValidationIssues] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const loadReview = async () => {
        try {
            setLoading(true);
            const res = await getInspectionReview(inspectionId);
            setReviewData(res.data);
            // Fetch user role
            try {
                const userRes = await getCurrentUser();
                setUserRole(userRes.role_id);
            } catch (err) {
                console.error('Failed to fetch user role', err);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (inspectionId) loadReview();
    }, [inspectionId]);

    // Auto-Print Effect
    useEffect(() => {
        if (isPrintMode && !loading && reviewData) {
            // Small timeout to ensure DOM is fully rendered (images etc)
            const list = reviewData?.images || [];
            if (list.length > 0) {
                // optionally wait for images? 
                // Browsers generally print what is there.
                // A small delay helps
                setTimeout(() => {
                    window.print();
                }, 500);
            } else {
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        }
    }, [loading, isPrintMode, reviewData]);

    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit this inspection?")) return;

        setIsSubmitting(true);
        try {
            await submitInspection(inspectionId);
            setSubmitted(true);
            alert("Inspection submitted successfully!");
        } catch (err) {
            console.error(err);
            // Backend returns 400 with "issues" if validation fails
            if (err.response?.data?.data?.issues) {
                const issues = err.response.data.data.issues;
                setValidationIssues(issues);
                setShowValidationModal(true);
            } else {
                alert("Failed to submit inspection. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReview = async () => {
        if (!window.confirm("Are you sure you want to mark this inspection as REVIEWED?")) return;
        setIsReviewing(true);
        try {
            await finalizeReview(inspectionId);
            alert("Inspection marked as REVIEWED successfully!");
            loadReview(); // Refresh data to show reviewed status
        } catch (err) {
            console.error(err);
            alert("Failed to review inspection.");
        } finally {
            setIsReviewing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading review data...</div>;

    if (submitted) {
        return (
            <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Inspection Submitted!</h2>
                <div className="flex gap-4 mt-8">
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                        Create Another
                    </Button>
                    <Button
                        onClick={onSubmitSuccess}
                        className="bg-[#546E7A] text-white px-8"
                    >
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const { inspection, images, inspection_checklist } = reviewData || {};

    const isReadOnly = readOnly || (inspection?.is_submitted === 1 && ![1, 3, 4].includes(userRole));

    return (
        <>
            <div className="space-y-4 pb-12">
                {/* Basic Info Summary */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            <h3 className="text-xl font-bold text-[#546E7A]">General Information</h3>
                        </div>
                        {inspection?.is_reviewed === 1 && (
                            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-black uppercase">
                                <UserCheck className="w-4 h-4" />
                                REVIEWED
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-6 bg-gray-50 p-6 rounded-[24px] border-2 border-gray-300 relative shadow-sm">
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Tank Number</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.tank_number || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Report Number</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.report_number || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Date</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.inspection_date || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">status</label>
                            <p className="text-base font-bold text-blue-600">{inspection?.status_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Product</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.product_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Location</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.location_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Vacuum Reading</label>
                            <p className="text-base font-bold text-gray-800">
                                {inspection?.vacuum_reading
                                    ? `${inspection.vacuum_reading} ${inspection.vacuum_uom || ''}`.trim()
                                    : 'N/A'}
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Lifter Weight</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.lifter_weight_value || '0'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Inspection Type</label>
                            <p className="text-base font-bold text-[#546E7A]">{inspection?.inspection_type_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Safety Valve Brand</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.safety_valve_brand || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Manufacturer</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.mfgr || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Ownership</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.ownership || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Pressure</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.working_pressure ? `${inspection.working_pressure} BAR` : 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Temp</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.design_temperature || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Frame</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.frame_type || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Cabinet</label>
                            <p className="text-base font-bold text-gray-800">{inspection?.cabinet_type || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Next Periodic Inspection Due</label>
                            <p className={`text-base font-bold ${inspection?.pi_next_inspection_date ? 'text-gray-800' : 'text-green-500'}`}>
                                {inspection?.pi_next_inspection_date || 'NOT SET'}
                            </p>
                        </div>
                    </div>
                </section >

                {/* Checklist Summary - INCREASED FONT & ROUNDED CORNERS */}
                < section >
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-6 h-6 text-green-500" />
                        <h3 className="text-2xl font-bold text-[#546E7A]">Inspection Checklist</h3>
                    </div>
                    <div className="space-y-2">
                        {inspection_checklist?.map(job => (
                            <div key={job.job_id} className="bg-white border-2 border-gray-300 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <span className="text-base font-bold text-gray-700">{job.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-black uppercase px-3 py-1 rounded-[10px] ${job.status_name === 'OK' ? 'bg-green-100 text-green-700' : job.status_name === 'NA' ? 'bg-white text-gray-700 border border-gray-300' : 'bg-red-100 text-red-700'}`}>
                                            {job.status_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5">
                                    {job.items?.map((it, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-4 py-2 border-b border-gray-200 last:border-0 pl-1">
                                            <div className="flex-1">
                                                <p className="text-base font-medium text-gray-600 leading-tight"><span className="font-bold mr-2 text-gray-400 text-sm">{it.sn}</span> {it.title}</p>
                                                {it.comment && <p className="text-sm text-red-500 italic mt-1 font-mono">Comment: {it.comment}</p>}
                                                {it.assigned_images?.length > 0 && (
                                                    <div className="flex flex-wrap gap-4 mt-3">
                                                        {it.assigned_images.map((imgObj, i) => (
                                                            <div key={i} className="flex flex-col items-center gap-1">
                                                                <div className="relative group">
                                                                    <img 
                                                                        src={imgObj.url} 
                                                                        className="w-20 h-20 rounded-[12px] object-cover border-2 border-red-100 shadow-sm transition-transform hover:scale-105" 
                                                                        alt="Assigned fault" 
                                                                    />
                                                                </div>
                                                                {imgObj.name && (
                                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">
                                                                        {imgObj.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`w-3 h-3 mt-1.5 rounded-full ${it.status_id === 1 ? 'bg-green-500' : it.status_id === 2 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section >

                {/* Photos Summary */}
                < section >
                    <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-6 h-6 text-purple-500" />
                        <h3 className="text-2xl font-bold text-[#546E7A]">Captured Photos</h3>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {images?.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-[20px] overflow-hidden shadow-sm border-2 border-gray-300">
                                <img
                                    src={img.image_url || getUploadUrl(img.image_path)}
                                    alt={img.image_type}
                                    className="w-full h-full object-cover"
                                />
                                {img.is_marked === 1 && (
                                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125 z-10 ${img.is_assigned === 1 ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200 animate-pulse'}`}></div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                                    <p className="text-xs text-white font-black uppercase truncate">{img.image_type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section >

                {/* Action Buttons */}
                {!isPrintMode && (
                    <div className="flex justify-center gap-6 pt-10">
                        {!isReadOnly && (
                            <Button
                                onClick={handleSubmit}
                                variant="primary"
                                icon={Send}
                                isLoading={isSubmitting}
                                className="bg-[#48BB78] hover:bg-[#38A169] text-white px-16 py-4 rounded-[24px] shadow-xl shadow-green-200 text-2xl font-black"
                            >
                                {mode === 'ADD' ? 'Submit Final Report' : 'UPDATE FINAL REPORT'}
                            </Button>
                        )}

                        {readOnly && inspection?.is_reviewed === 0 && (
                            <Button
                                onClick={handleReview}
                                variant="secondary"
                                icon={UserCheck}
                                isLoading={isReviewing}
                                disabled={!(inspection?.is_submitted === 1 || inspection?.web_submitted === 1) || isReviewing}
                                className={
                                    `text-white px-16 py-4 rounded-[24px] shadow-xl text-2xl font-black ` +
                                    ((inspection?.is_submitted === 1 || inspection?.web_submitted === 1)
                                        ? 'bg-[#3182CE] hover:bg-[#2B6CB0] shadow-blue-200'
                                        : 'bg-gray-400 shadow-gray-200')
                                }
                            >
                                REVIEWED
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Validation Modal */}
            {
                showValidationModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-[30px] max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
                            <h3 className="text-2xl font-bold mb-4 text-red-600">Cannot Submit Inspection</h3>
                            <div className="text-lg space-y-4">
                                {validationIssues?.inspection?.length > 0 && (
                                    <div>
                                        <strong className="text-red-500">❌ Basic Info Incomplete:</strong>
                                        <ul className="list-disc list-inside mt-2">
                                            {validationIssues.inspection.map((issue, idx) => (
                                                <li key={idx} className="text-gray-700">{issue.field}: {issue.reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {validationIssues?.images?.length > 0 && (
                                    <div>
                                        <strong className="text-red-500">❌ Missing Photos:</strong>
                                        <ul className="list-disc list-inside mt-2">
                                            {validationIssues.images.map((issue, idx) => (
                                                <li key={idx} className="text-gray-700">{issue.reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {validationIssues?.checklist?.length > 0 && (
                                    <div>
                                        <strong className="text-red-500">❌ Checklist Incomplete:</strong>
                                        <p className="mt-2 text-gray-700">{validationIssues.checklist.length} checklist items have missing required fields</p>
                                    </div>
                                )}
                                {validationIssues?.to_do_list?.length > 0 && (
                                    <div>
                                        <strong className="text-red-500">❌ Unresolved Issues:</strong>
                                        <ul className="list-disc list-inside mt-2">
                                            {validationIssues.to_do_list.map((issue, idx) => (
                                                <li key={idx} className="text-gray-700">
                                                    {issue.flagged_jobs ? `${issue.flagged_jobs.length} jobs have unresolved flagged items` : issue.reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 mt-6 text-xl">Please complete all required fields before submitting.</p>
                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setShowValidationModal(false)} variant="secondary" className="rounded-xl px-6 py-2">
                                    OK
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
