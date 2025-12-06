export interface ComplaintPDFData {
  complaintId: string;
  dateSubmitted: string;
  caretaker: string;
  typeOfProblem: string;
  description: string;
  status: string;
  timeline: Array<{
    date: string;
    status: string;
    description: string;
    isCompleted: boolean;
  }>;
  complianceSummary?: {
    dateSubmitted: string;
    acknowledgedBy: string;
    investigatedOn: string;
    closedOn: string;
    notes?: string;
  };
  complianceStatement?: string;
}

export function generatePDF(data: ComplaintPDFData) {
  // Create a new window for PDF generation
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Complaint ${data.complaintId} - Compliance Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #fff;
            color: #1F2022;
          }
          .header {
            border-bottom: 3px solid #2AB3EE;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2AB3EE;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #1F2022;
            font-size: 20px;
            margin-bottom: 15px;
            border-bottom: 2px solid #E6E6E6;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table th, table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E6E6E6;
          }
          table th {
            background-color: #2A2B30;
            color: #E6E6E6;
            font-weight: 600;
          }
          table td {
            color: #1F2022;
          }
          .timeline {
            margin-left: 20px;
          }
          .timeline-item {
            margin-bottom: 15px;
            padding-left: 30px;
            position: relative;
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${data.timeline[0]?.isCompleted ? '#009200' : '#2AB3EE'};
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-in-progress {
            background: #2AB3EE;
            color: #fff;
          }
          .status-refused {
            background: #FF3F3F;
            color: #fff;
          }
          .status-closed {
            background: #009200;
            color: #fff;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E6E6E6;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Complaint Compliance Report</h1>
          <p>Complaint ID: ${data.complaintId} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>Complaint Information</h2>
          <table>
            <tr>
              <th>Date Submitted</th>
              <td>${data.dateSubmitted}</td>
            </tr>
            <tr>
              <th>Caretaker</th>
              <td>${data.caretaker}</td>
            </tr>
            <tr>
              <th>Type of Problem</th>
              <td>${data.typeOfProblem}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>${data.description}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>
                <span class="status-badge status-${data.status.toLowerCase().replace(' ', '-')}">
                  ${data.status}
                </span>
              </td>
            </tr>
          </table>
        </div>

        ${data.complianceSummary ? `
        <div class="section">
          <h2>Compliance Summary</h2>
          <table>
            <tr>
              <th>Date Submitted</th>
              <td>${data.complianceSummary.dateSubmitted}</td>
            </tr>
            <tr>
              <th>Acknowledged By</th>
              <td>${data.complianceSummary.acknowledgedBy}</td>
            </tr>
            <tr>
              <th>Investigated On</th>
              <td>${data.complianceSummary.investigatedOn}</td>
            </tr>
            <tr>
              <th>Closed On</th>
              <td>${data.complianceSummary.closedOn}</td>
            </tr>
            ${data.complianceSummary.notes ? `
            <tr>
              <th>Notes</th>
              <td>${data.complianceSummary.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2>Complaint Timeline</h2>
          <div class="timeline">
            ${data.timeline.map(item => `
              <div class="timeline-item">
                <strong>${item.date}: ${item.status}</strong>
                <p>${item.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        ${data.complianceStatement ? `
        <div class="section">
          <h2>Compliance Statement</h2>
          <p>✓ ${data.complianceStatement}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>This document was generated automatically by Legacy Verify Complaint Portal</p>
          <p>© ${new Date().getFullYear()} Legacy Verify. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

