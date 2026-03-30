/**
 * exportReport.ts
 * Клиентский экспорт отчётов в PDF и Excel (только для администратора).
 * PDF  — jsPDF + autoTable (CDN)
 * Excel — SheetJS (CDN)
 */

import { ApiReport, ApiAnswer, questionnairesApi } from './api';

// ─── CDN loader helpers ───────────────────────────────────────────────────────

function loadScript(src: string, globalKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any)[globalKey]) { resolve((window as any)[globalKey]); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any)[globalKey]));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve((window as any)[globalKey]);
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getJsPDF() {
  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'jspdf'
  );
  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
    'jspdfAutotable'
  );
  return (window as any).jspdf.jsPDF as any;
}

async function getXLSX() {
  return loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'XLSX'
  );
}

// ─── Shared data builder ──────────────────────────────────────────────────────

export interface ReportExportData {
  report: ApiReport;
  answers: ApiAnswer[];
  questionTexts: Record<number, { text: string; category: string; maxScore: number }>;
}

export async function buildExportData(
  report: ApiReport,
  answers: ApiAnswer[]
): Promise<ReportExportData> {
  let questionTexts: ReportExportData['questionTexts'] = {};
  try {
    const q = await questionnairesApi.get(report.questionnaire);
    (q.questions ?? []).forEach(qq => {
      questionTexts[qq.id] = { text: qq.text, category: qq.category, maxScore: qq.max_score };
    });
  } catch {
    // fallback: show question IDs
  }
  return { report, answers, questionTexts };
}

// ─── PDF export ───────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = { E: 'Environmental', S: 'Social', G: 'Governance' };
const CAT_COLORS: Record<string, [number, number, number]> = {
  E: [34, 197, 94],
  S: [249, 115, 22],
  G: [59, 130, 246],
};

export async function exportToPDF(data: ReportExportData): Promise<void> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { report, answers, questionTexts } = data;

  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ESG Report', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Сформирован: ${new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 20);
  doc.text(`ID отчёта: #${report.id}`, pageW - margin, 20, { align: 'right' });

  let y = 36;

  // ── Report meta ─────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(report.companyName ?? '—', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const metaLine = [
    report.questionnaireName,
    report.periodName,
    `Респондент: ${report.respondentName}`,
  ].filter(Boolean).join('  ·  ');
  doc.text(metaLine, margin, y);
  y += 5;

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    submitted: [34, 197, 94], draft: [148, 163, 184], reviewed: [168, 85, 247],
  };
  const [sr, sg, sb] = statusColors[report.status] ?? [148, 163, 184];
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(margin, y, 28, 6, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(report.status.toUpperCase(), margin + 14, y + 4.3, { align: 'center' });
  y += 12;

  // ── ESG Score Summary ────────────────────────────────────────────────────────
  if (report.total_score != null) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 32, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, 32, 4, 4, 'S');

    // Total
    const totalX = margin + contentW / 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Итоговый ESG балл', totalX, y + 9, { align: 'center' });
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 220);
    doc.text(String(Math.round(report.total_score)), totalX, y + 22, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('/ 100', totalX + 10, y + 22);

    // E / S / G boxes
    const scores = [
      { key: 'E', val: report.eScore },
      { key: 'S', val: report.sScore },
      { key: 'G', val: report.gScore },
    ];
    const boxW = 28;
    scores.forEach((sc, i) => {
      const bx = margin + 8 + i * (boxW + 4);
      const [r2, g2, b2] = CAT_COLORS[sc.key];
      doc.setFillColor(r2, g2, b2, 0.1);
      doc.roundedRect(bx, y + 4, boxW, 24, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(r2, g2, b2);
      doc.text(CAT_LABELS[sc.key], bx + boxW / 2, y + 10, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r2, g2, b2);
      doc.text(sc.val != null ? Math.round(sc.val).toString() : '—', bx + boxW / 2, y + 22, { align: 'center' });
    });

    y += 38;
  }

  // ── Answers by category ─────────────────────────────────────────────────────
  for (const cat of ['E', 'S', 'G']) {
    const catAnswers = answers.filter(a => {
      const q = questionTexts[a.question];
      return q?.category === cat;
    });
    if (catAnswers.length === 0) continue;

    // Section header
    const [cr, cg, cb] = CAT_COLORS[cat];
    doc.setFillColor(cr, cg, cb);
    doc.rect(margin, y, 4, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${cat}  —  ${CAT_LABELS[cat]}`, margin + 7, y + 6);
    y += 12;

    const tableBody = catAnswers.map((a, idx) => {
      const q = questionTexts[a.question];
      const qText = q?.text ?? `Вопрос #${a.question}`;
      const answer =
        a.text_value ??
        (a.choice_value?.length ? a.choice_value.join(', ') : null) ??
        (a.number_value != null ? String(a.number_value) : '—');
      const score = a.score != null
        ? `${a.score?.toFixed(1)} / ${q?.maxScore ?? '?'}`
        : '—';
      return [idx + 1, qText, answer, score];
    });

    (doc as any).autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Вопрос', 'Ответ', 'Балл']],
      body: tableBody,
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
      headStyles: { fillColor: [cr, cg, cb], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 70 },
        3: { cellWidth: 22, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.3,
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Page break guard
    if (y > 260) { doc.addPage(); y = 15; }
  }

  // ── Footer on each page ──────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 287, pageW, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('ESG Platform  ·  Конфиденциально', margin, 293);
    doc.text(`Стр. ${i} / ${pageCount}`, pageW - margin, 293, { align: 'right' });
  }

  const fileName = `ESG_${report.companyName?.replace(/\s+/g, '_') ?? report.id}_${report.periodName?.replace(/\s+/g, '_') ?? ''}.pdf`;
  doc.save(fileName);
}

// ─── Excel export ─────────────────────────────────────────────────────────────

export async function exportToExcel(data: ReportExportData): Promise<void> {
  const XLSX = await getXLSX();
  const { report, answers, questionTexts } = data;

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summaryRows = [
    ['ESG ОТЧЁТ', ''],
    ['', ''],
    ['Компания',        report.companyName ?? '—'],
    ['Опросник',        report.questionnaireName ?? '—'],
    ['Период',          report.periodName ?? '—'],
    ['Респондент',      report.respondentName ?? '—'],
    ['Статус',          report.status],
    ['Дата сдачи',      report.submitted_at ? new Date(report.submitted_at).toLocaleDateString('ru-RU') : '—'],
    ['', ''],
    ['БАЛЛЫ ESG', ''],
    ['Итоговый балл',   report.total_score != null ? Math.round(report.total_score) : '—'],
    ['Environmental (E)', report.eScore != null ? Math.round(report.eScore) : '—'],
    ['Social (S)',        report.sScore != null ? Math.round(report.sScore) : '—'],
    ['Governance (G)',    report.gScore != null ? Math.round(report.gScore) : '—'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

  // ── Sheet 2: All answers ────────────────────────────────────────────────────
  const answerRows: any[][] = [
    ['Категория', 'Вопрос', 'Тип ответа', 'Ответ', 'Балл', 'Макс. балл', '% от макс.'],
  ];
  for (const cat of ['E', 'S', 'G']) {
    const catAnswers = answers.filter(a => questionTexts[a.question]?.category === cat);
    catAnswers.forEach(a => {
      const q = questionTexts[a.question];
      const answer =
        a.text_value ??
        (a.choice_value?.length ? a.choice_value.join('; ') : null) ??
        (a.number_value != null ? a.number_value : '—');
      const answerType =
        a.choice_value?.length ? 'выбор' :
        a.number_value != null ? 'число' : 'текст';
      const maxScore = q?.maxScore ?? null;
      const score = a.score ?? null;
      const pct = score != null && maxScore ? Math.round((score / maxScore) * 100) : null;
      answerRows.push([
        `${cat} — ${CAT_LABELS[cat]}`,
        q?.text ?? `Вопрос #${a.question}`,
        answerType,
        answer,
        score,
        maxScore,
        pct != null ? `${pct}%` : '—',
      ]);
    });
  }
  const wsAnswers = XLSX.utils.aoa_to_sheet(answerRows);
  wsAnswers['!cols'] = [
    { wch: 22 }, { wch: 60 }, { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAnswers, 'Ответы');

  // ── Sheet 3: Per-category tabs ──────────────────────────────────────────────
  for (const cat of ['E', 'S', 'G']) {
    const catAnswers = answers.filter(a => questionTexts[a.question]?.category === cat);
    if (catAnswers.length === 0) continue;
    const rows: any[][] = [
      [`${cat} — ${CAT_LABELS[cat]}`],
      ['Вопрос', 'Ответ', 'Балл', 'Макс. балл', '% от макс.'],
    ];
    catAnswers.forEach(a => {
      const q = questionTexts[a.question];
      const answer =
        a.text_value ??
        (a.choice_value?.length ? a.choice_value.join('; ') : null) ??
        (a.number_value != null ? a.number_value : '—');
      const maxScore = q?.maxScore ?? null;
      const score = a.score ?? null;
      const pct = score != null && maxScore ? Math.round((score / maxScore) * 100) : null;
      rows.push([q?.text ?? `#${a.question}`, answer, score, maxScore, pct != null ? `${pct}%` : '—']);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 60 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, cat === 'E' ? 'Environmental' : cat === 'S' ? 'Social' : 'Governance');
  }

  const fileName = `ESG_${report.companyName?.replace(/\s+/g, '_') ?? report.id}_${report.periodName?.replace(/\s+/g, '_') ?? ''}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ─── Bulk export (all filtered reports as one Excel) ─────────────────────────

export async function exportBulkToExcel(reports: ApiReport[]): Promise<void> {
  const XLSX = await getXLSX();

  const rows: any[][] = [
    ['#', 'Компания', 'Респондент', 'Опросник', 'Период', 'Статус', 'E', 'S', 'G', 'Итого', 'Дата сдачи'],
  ];
  reports.forEach((r, i) => {
    rows.push([
      i + 1,
      r.companyName ?? '—',
      r.respondentName ?? '—',
      r.questionnaireName ?? '—',
      r.periodName ?? '—',
      r.status,
      r.eScore != null ? Math.round(r.eScore) : '—',
      r.sScore != null ? Math.round(r.sScore) : '—',
      r.gScore != null ? Math.round(r.gScore) : '—',
      r.total_score != null ? Math.round(r.total_score) : '—',
      r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('ru-RU') : '—',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 35 }, { wch: 18 },
    { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Все отчёты');

  const now = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  XLSX.writeFile(wb, `ESG_Reports_${now}.xlsx`);
}
