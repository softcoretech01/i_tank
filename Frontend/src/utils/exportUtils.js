/**
 * Utility to export data to CSV (which opens in Excel)
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects { label, key }
 * @param {string} fileName - Name of the file to download
 */
export const exportToCSV = (data, headers, fileName = 'export.csv') => {
  if (!data || !data.length) {
    alert('No data to export');
    return;
  }

  // 1. Create CSV header row
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');

  // 2. Create data rows
  const dataRows = data.map(item => {
    return headers.map(h => {
      let value = item[h.key];
      
      // Handle nested properties or formatting
      if (h.formatter) {
        value = h.formatter(value, item);
      }
      
      // Format as string and escape quotes
      const stringValue = value === null || value === undefined ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // 3. Combine and add BOM for Excel UTF-8 support
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');

  // 4. Create Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
