import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { 
  Loan, 
  Agent, 
  LoanProduct, 
  LoanStatementResponse, 
  LoanStatementEntry,
  DashboardStats,
  PortfolioReport,
  CollectionsReport
} from "./types";

/**
 * Formats a number as currency for the PDF
 */
const formatCurrency = (amount: number | string) => {
  const val = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(val || 0);
};

/**
 * Generates a professional Loan Statement PDF
 */
export const generateLoanStatementPDF = (
  loan: Loan,
  agent: Agent,
  product: LoanProduct | null,
  statement: LoanStatementResponse
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- Define Theme Colors ---
  const PRIMARY_COLOR = [0, 75, 145]; // Interswitch Blue (#004B91)
  const SECONDARY_COLOR = [227, 28, 45]; // Red (#E31C2D)
  const TEXT_DARK = [33, 37, 41];
  const TEXT_GRAY = [108, 117, 125];

  // --- Header Section ---
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ISW-Loans", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Interswitch Loan Management System", 15, 28);
  
  doc.setFontSize(18);
  doc.text("LOAN STATEMENT", pageWidth - 15, 25, { align: "right" });

  // --- Summary Section ---
  let currentY = 55;
  
  // Agent Details
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("AGENT INFORMATION", 15, currentY);
  
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${agent.full_name}`, 15, currentY + 8);
  doc.text(`Agent ID: ${agent.agent_id}`, 15, currentY + 14);
  doc.text(`Phone: ${agent.phone_number || "N/A"}`, 15, currentY + 20);
  
  // Loan Details (Right Column)
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN SUMMARY", pageWidth / 2 + 10, currentY);
  
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont("helvetica", "normal");
  doc.text(`Reference: ${loan.disbursement_reference || loan.id.substring(0, 8)}`, pageWidth / 2 + 10, currentY + 8);
  
  // Robust product name fallback
  const productName = product?.name || 
                     (loan.loan_type === 'pay_day' ? 'Pay Day Loan' : 
                      loan.loan_type === 'float' ? 'Float Loan' : 'Loan');
  doc.text(`Product: ${productName}`, pageWidth / 2 + 10, currentY + 14);
  
  doc.text(`Status: ${loan.status.toUpperCase()}`, pageWidth / 2 + 10, currentY + 20);
  doc.text(`Due Date: ${format(new Date(loan.due_date), "dd MMM yyyy")}`, pageWidth / 2 + 10, currentY + 26);

  currentY += 40;

  // --- Financial Account Summary ---
  doc.setFillColor(245, 245, 245);
  doc.rect(15, currentY - 5, pageWidth - 30, 20, "F");
  
  const stats = [
    { label: "Principal", value: formatCurrency(loan.principal_amount) },
    { label: "Total Interest", value: formatCurrency(loan.interest_amount) },
    { label: "Total Penalty", value: formatCurrency(loan.penalty_amount) },
    { label: "Total Paid", value: formatCurrency(loan.total_paid) },
    { label: "Outstanding", value: formatCurrency(loan.outstanding_balance) },
  ];
  
  const colWidth = (pageWidth - 30) / 5;
  stats.forEach((stat, i) => {
    doc.setFontSize(7);
    doc.setTextColor(TEXT_GRAY[0], TEXT_GRAY[1], TEXT_GRAY[2]);
    doc.setFont("helvetica", "bold");
    doc.text(stat.label.toUpperCase(), 18 + (i * colWidth), currentY + 2);
    
    doc.setFontSize(9);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const isOutstanding = stat.label === "Outstanding";
    if (isOutstanding) doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(stat.value, 18 + (i * colWidth), currentY + 10);
  });

  currentY += 25;

  // --- Detailed Transaction Ledger ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION LEDGER", 15, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Description", "Ref", "Debit", "Credit", "Balance"]],
    body: statement.entries.map((entry: LoanStatementEntry) => [
      format(new Date(entry.date), "dd/MM/yyyy"),
      entry.description,
      entry.reference || "-",
      entry.debit > 0 ? formatCurrency(entry.debit) : "-",
      entry.credit > 0 ? formatCurrency(entry.credit) : "-",
      formatCurrency(entry.balance)
    ]),
    headStyles: {
      fillColor: PRIMARY_COLOR as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: TEXT_DARK as [number, number, number],
    },
    didParseCell: (data) => {
      // Shading for Interest/Penalty to distinguish from payments
      if (data.section === 'body' && data.column.index === 1) {
        const text = (data.cell.raw as string) || "";
        if (text.includes("Interest") || text.includes("Penalty")) {
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.textColor = TEXT_GRAY as [number, number, number];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 25, fontStyle: "italic", fontSize: 7 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", fontStyle: "bold", cellWidth: 28 },
    },
    margin: { left: 15, right: 15 },
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setTextColor(TEXT_GRAY[0], TEXT_GRAY[1], TEXT_GRAY[2]);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Statement generated on ${format(new Date(), "dd MMMM yyyy HH:mm")}`,
    15,
    finalY
  );
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  const filename = `Statement_${loan.disbursement_reference || loan.id.substring(0, 8)}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);
};

/**
 * Generates a comprehensive Portfolio & Collections Report PDF
 */
export const generateReportPDF = (
  stats: DashboardStats,
  portfolio: PortfolioReport,
  collections: CollectionsReport
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- Define Theme Colors ---
  const PRIMARY_COLOR = [0, 75, 145]; // Interswitch Blue (#004B91)
  const SECONDARY_COLOR = [227, 28, 45]; // Red (#E31C2D)
  const TEXT_DARK = [33, 37, 41];
  const TEXT_GRAY = [108, 117, 125];

  // --- Header Section ---
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ISW-Loans", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Interswitch Loan Management System", 15, 28);
  
  doc.setFontSize(18);
  doc.text("PORTFOLIO PERFORMANCE REPORT", pageWidth - 15, 25, { align: "right" });

  let currentY = 55;

  // --- 1. Executive Summary ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", 15, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Metric", "Value", "Description"]],
    body: [
      ["Total Active Loans", stats.total_active_loans.toString(), "Number of loans currently in repayment"],
      ["Total Portfolio Value", formatCurrency(portfolio.total_portfolio), "Total outstanding principal balance"],
      ["Total Interest Earned", formatCurrency(stats.total_interest_earned), "Cumulative interest accrued"],
      ["Portfolio at Risk (PAR 30)", `${portfolio.par_30}%`, "Loans overdue by more than 30 days"],
      ["Overall Collection Rate", `${collections.collection_rate}%`, "Efficiency of repayment collections"],
    ],
    headStyles: { fillColor: PRIMARY_COLOR as [number, number, number], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // --- 2. Portfolio at Risk (PAR) Aging ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PORTFOLIO AT RISK (PAR) AGING", 15, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Aging Bracket", "Percentage", "Status"]],
    body: [
      ["PAR 30", `${portfolio.par_30}%`, portfolio.par_30 > 10 ? "CRITICAL" : "STABLE"],
      ["PAR 60", `${portfolio.par_60}%`, portfolio.par_60 > 5 ? "WARNING" : "STABLE"],
      ["PAR 90+", `${portfolio.par_90}%`, portfolio.par_90 > 2 ? "HIGH RISK" : "WATCH"],
    ],
    headStyles: { fillColor: SECONDARY_COLOR as [number, number, number], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // --- 3. Collection by Channel ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COLLECTIONS BY CHANNEL", 15, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Channel", "Amount Collected", "Volume", "Share"]],
    body: collections.by_channel.map(c => [
      c.channel.replace("_", " ").toUpperCase(),
      formatCurrency(c.amount),
      c.count.toString(),
      `${c.percentage}%`
    ]),
    headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "right" }
    },
    margin: { left: 15, right: 15 },
  });

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(TEXT_GRAY[0], TEXT_GRAY[1], TEXT_GRAY[2]);
    doc.text(
      `Report generated on ${format(new Date(), "dd MMMM yyyy HH:mm")}`,
      15,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  const filename = `Portfolio_Report_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);
};
