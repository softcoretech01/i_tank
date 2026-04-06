import api from './api';

// 1. Fetch Inspection List for Dropdown
export const getInspections = async (tankId) => {
  try {
    const response = await api.get(`/ppt/get-inspections/${tankId}`);
    return response.data; // Expected: [{ report_number: "...", inspection_id: 123 }, ...]
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
};

export const handleGeneratePPT = async (tankId, inspectionId = null) => {
  try {
    // 1. Remove 'responseType: blob'. We expect JSON now.
    const payload = {
      tank_id: parseInt(tankId),
      inspection_id: inspectionId ? parseInt(inspectionId) : null
    };

    const response = await api.post('/ppt/generate', payload);

    // 2. Check if the backend returned the S3 URL
    const { cdn_url, filename } = response.data;

    if (cdn_url) {
      // 3. Trigger download using the S3 URL
      const link = document.createElement('a');
      link.href = cdn_url;

      // Note: 'download' attribute might be ignored for cross-origin (S3) URLs 
      // depending on browser security, but it's good practice.
      link.download = filename || `Tank_${tankId}_Report.pptx`;
      link.setAttribute('download', filename); // Double check attribute

      window.isDownloading = true;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.isDownloading = false;
      }, 1000);

      return true;
    } else {
      console.error("No CDN URL found in response");
      alert("PPT generated but no download link returned.");
      return false;
    }

  } catch (error) {
    console.error("PPT Generation Error:", error);
    // tailored error message
    const msg = error.response?.data?.detail || "Failed to generate PPT.";
    alert(msg);
    return false;
  }
};