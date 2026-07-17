import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateEmergencyCardPDF = async (elementId: string, filename: string = "Emergency_Card.pdf"): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found for PDF generation");

  // Temporarily ensure the element is visible in the layout for html2canvas
  const originalDisplay = element.style.display;
  element.style.display = 'block';

  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    
    // Calculate aspect ratio to fit A4 paper
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } finally {
    // Restore display
    element.style.display = originalDisplay;
  }
};

export const generatePatientSummaryPDF = async (member: any, records: any[], filename: string = "Patient_Summary.pdf"): Promise<void> => {
  const pdf = new jsPDF("p", "mm", "a4");
  
  // Header
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42);
  pdf.text("AAYU - Patient Medical Summary", 20, 20);
  
  pdf.setFontSize(14);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Patient: ${member.displayName || member.name}`, 20, 30);
  pdf.text(`Role: ${member.role || 'Member'}`, 20, 38);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 46);
  
  pdf.setDrawColor(226, 232, 240);
  pdf.line(20, 52, 190, 52);

  // Profile Info
  let y = 62;
  if (member.profile) {
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Clinical Profile", 20, y);
    y += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(51, 65, 85);
    pdf.text(`Blood Group: ${member.profile.bloodGroup || 'N/A'}`, 20, y);
    pdf.text(`Height: ${member.profile.height ? member.profile.height + ' cm' : 'N/A'}`, 80, y);
    pdf.text(`Weight: ${member.profile.weight ? member.profile.weight + ' kg' : 'N/A'}`, 140, y);
    y += 8;
    pdf.text(`Allergies: ${member.profile.allergies?.join(', ') || 'None reported'}`, 20, y);
    y += 8;
    if (member.profile.currentMedications?.length) {
      pdf.text(`Current Medications: ${member.profile.currentMedications.join(', ')}`, 20, y);
      y += 8;
    }
  }

  y += 10;
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Recent Medical Records", 20, y);
  y += 10;

  // Add top 5 records
  const recentRecords = records.slice(0, 5);
  if (recentRecords.length === 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(100, 116, 139);
    pdf.text("No medical records uploaded.", 20, y);
  } else {
    recentRecords.forEach(r => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${r.recordDate || new Date(r.uploadedAt).toLocaleDateString()} - ${r.title} (${r.category})`, 20, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      if (r.hospital) pdf.text(`Facility: ${r.hospital}`, 20, y);
      y += 6;
      if (r.geminiSummary) {
        const lines = pdf.splitTextToSize(`Summary: ${r.geminiSummary}`, 170);
        pdf.text(lines, 20, y);
        y += (lines.length * 5) + 2;
      } else {
        y += 2;
      }
    });
  }

  pdf.save(filename);
};
