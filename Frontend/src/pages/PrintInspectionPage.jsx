import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewTab from '../components/inspection/ReviewTab';
import { ArrowLeft } from 'lucide-react';

export default function PrintInspectionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const inspectionId = id ? parseInt(id) : null;
    return (
        <div className="bg-white min-h-screen p-8 print:p-0">
            <div className="print:hidden mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to List
                </button>
            </div>
            <style type="text/css" media="print">
                {`
                @page { size: auto; margin: 5mm; }
                body { -webkit-print-color-adjust: exact; margin: 10mm; }
                .print\\:hidden { display: none !important; }
                `}
            </style>
            <ReviewTab inspectionId={inspectionId} readOnly={true} isPrintMode={true} />
        </div>
    );
}
