import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, FileText, RefreshCw } from 'lucide-react';
import { getTankCertificates } from '../../services/tankCertificateService';

// Unwrap UniformResponseMiddleware envelope
const unwrap = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data;
  }
  return response;
};

const PDF_SLOTS = [
  { field: 'periodic_inspection_pdf_path', nameField: 'periodic_inspection_pdf_name', label: 'Periodic Inspection PDF', color: 'blue' },
  { field: 'next_insp_pdf_path', nameField: 'next_insp_pdf_name', label: 'Next Inspection PDF', color: 'indigo' },
  { field: 'new_certificate_file', nameField: 'new_certificate_file_name', label: 'New Certificate PDF', color: 'green' },
  { field: 'old_certificate_file', nameField: 'old_certificate_file_name', label: 'Old Certificate PDF', color: 'amber' },
];

const colorMap = {
  blue: { icon: 'bg-blue-100 text-blue-600', badge: 'text-blue-500', btn: 'text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600', card: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300' },
  indigo: { icon: 'bg-indigo-100 text-indigo-600', badge: 'text-indigo-500', btn: 'text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600', card: 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300' },
  green: { icon: 'bg-green-100 text-green-600', badge: 'text-green-500', btn: 'text-green-600 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600', card: 'border-green-100 bg-green-50/30 hover:bg-green-50 hover:border-green-300' },
  amber: { icon: 'bg-amber-100 text-amber-600', badge: 'text-amber-500', btn: 'text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600', card: 'border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300' },
};

export default function TankCertificateTab({ tankId, onClose, onNext }) {
  const safeTankId = (typeof tankId === 'object' && tankId !== null) ? tankId.id : tankId;

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCertificate = async () => {
    if (!safeTankId) return;
    try {
      setLoading(true);
      setError(null);
      const raw = await getTankCertificates(safeTankId);
      const data = unwrap(raw);
      const list = Array.isArray(data) ? data : [];
      // Only show active certificates (status === 1)
      const activeCert = list.find(item => item.status === 1);
      setCertificate(activeCert || null);
    } catch (err) {
      console.error('Error loading certificate:', err);
      setError('Failed to load certificate data.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (safeTankId) loadCertificate();
  }, [safeTankId]);

  // ---- No Tank ID ----
  if (!safeTankId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <p className="text-lg font-medium text-gray-700">Please save the "Tank Basic Details" first.</p>
      </div>
    );
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#54737E] mb-4"></div>
        <p className="text-sm font-medium">Loading certificate...</p>
      </div>
    );
  }

  // ---- No Certificate ----
  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-gray-100 rounded-xl">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-lg font-bold text-gray-700">No Certificate uploaded for this tank</p>
        <p className="text-sm text-gray-400 mt-2 italic">You can add certificates from the Certificates Master menu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">

      {/* Info Banner */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Certificate Details</h3>
        <button onClick={loadCertificate} className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: 'Certificate No', value: certificate.certificate_number, dot: 'bg-blue-500' },
          { label: 'Inspection Agency', value: certificate.inspection_agency, dot: 'bg-purple-500' },
          { label: '2.5Y Inspection', value: certificate.insp_2_5y_date, dot: 'bg-orange-500' },
          { label: 'Next Inspection', value: certificate.next_insp_date, dot: 'bg-red-500' },
        ].map(({ label, value, dot }) => (
          <div key={label} className="space-y-1 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            <p className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`}></span>
              {value || <span className="text-gray-300 italic font-normal">Not set</span>}
            </p>
          </div>
        ))}
      </div>

      {/* PDF Document Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
          Certificate PDFs
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PDF_SLOTS.map(({ field, nameField, label, color }) => {
            const url = certificate[field];
            const name = certificate[nameField];
            const hasFile = !!url;
            const c = colorMap[color];

            return (
              <div
                key={field}
                className={`relative group flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden ${hasFile
                    ? `${c.card} cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1`
                    : 'border-gray-100 bg-gray-50/50 opacity-60 border-dashed'
                  }`}
              >
                {/* Label + icon */}
                <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                  <div className={`p-2 rounded-full ${hasFile ? c.icon : 'bg-gray-100 text-gray-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-bold uppercase tracking-widest block ${hasFile ? c.badge : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {name && (
                      <p className="text-xs text-gray-500 truncate">{name}</p>
                    )}
                  </div>
                </div>

                {/* Status / Action */}
                <div className="px-4 pb-4">
                  {hasFile ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-3 py-2 bg-white rounded-full border text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 ${c.btn}`}
                    >
                      <Eye className="w-3 h-3" />
                      View PDF
                    </a>
                  ) : (
                    <span className="flex items-center justify-center px-3 py-2 bg-transparent text-gray-300 text-[10px] font-bold uppercase tracking-widest border border-gray-100 rounded-full">
                      Not Uploaded
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Buttons (for use inside tank modal) */}
      {(onClose || onNext) && (
        <div className="flex justify-end pt-3 mt-3 border-t space-x-3">
          {onClose && (
            <button onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors">
              Close
            </button>
          )}
          {onNext && (
            <button onClick={onNext} className="px-6 py-2 bg-[#54737E] text-white rounded font-bold hover:bg-[#455A64] transition-colors">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}