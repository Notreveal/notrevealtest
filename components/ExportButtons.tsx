import React from 'react';
import { FileDown, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { EditalData } from '../types';


interface ExportButtonsProps {
  editalData: EditalData | null;
}

// Brand color palette for consistent styling
const BRAND_COLORS = {
  indigo: { hex: '#4f46e5', rgb: [79, 70, 229] as [number, number, number] },
  white: { hex: '#ffffff', rgb: [255, 255, 255] as [number, number, number], xlsx: "FFFFFF" },
  slate: { hex: '#334155', rgb: [51, 65, 85] as [number, number, number] },
  lightGray: { xlsx: "F8FAFC" }, // slate-50
  border: { xlsx: "E2E8F0" }, // slate-200
  headerGreen: { xlsx: "166534" }, // A nice dark green, matching the image
};

const ExportButtons: React.FC<ExportButtonsProps> = ({ editalData: data }) => {
    if (!data) {
        return null;
    }

    const handlePdfExport = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
        let y = 35;

        // --- PDF Header ---
        doc.setFillColor(...BRAND_COLORS.indigo.rgb);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setFontSize(18);
        doc.setTextColor(...BRAND_COLORS.white.rgb);
        doc.setFont('helvetica', 'bold');
        doc.text('Edital Verticalizado', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255, 0.8);
        doc.text('Gerado por AI Edital Verticalizer', pageWidth / 2, 21, { align: 'center' });

        // --- Main Title ---
        doc.setFontSize(16);
        doc.setTextColor(...BRAND_COLORS.slate.rgb);
        doc.setFont('helvetica', 'bold');
        doc.text(data.titulo_concurso || "Detalhes do Concurso", 14, y);
        y += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Organização: ${data.organizacao || 'N/A'}`, 14, y);
        y += 10;
        
        const tableConfig = {
            startY: y,
            theme: 'grid' as const,
            headStyles: { 
                fillColor: BRAND_COLORS.indigo.rgb, 
                textColor: BRAND_COLORS.white.rgb, 
                fontStyle: 'bold',
                halign: 'center' as const
            },
            styles: {
                font: 'helvetica',
                fontSize: 10
            },
            didDrawPage: (hookData: any) => {
                // --- PDF Footer ---
                doc.setFontSize(8);
                doc.setTextColor(150);
                const pageStr = `Página ${hookData.pageNumber}`;
                doc.text(pageStr, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        };

        if (data.cargos && data.cargos.length > 0) {
            autoTable(doc, {
                ...tableConfig,
                head: [['Cargo', 'Vagas', 'Salário (R$)', 'Requisitos']],
                body: data.cargos.map(c => [
                    c.nome_cargo || '', 
                    c.vagas?.toString() || '', 
                    c.salario?.toFixed(2) || '',
                    c.requisitos?.join(', ') || ''
                ]),
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        if (data.cronograma && data.cronograma.length > 0) {
            autoTable(doc, {
                ...tableConfig,
                startY: y,
                head: [['Evento', 'Data']],
                body: data.cronograma.map(c => [c.evento || '', c.data || '']),
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

       if (data.conteudo_programatico && data.conteudo_programatico.length > 0) {
            const body = data.conteudo_programatico.flatMap(disciplina => 
                (disciplina.topicos || []).map((topico, index) => {
                    // Show discipline name only for the first topic
                    return index === 0 ? [disciplina.disciplina || '', topico] : ['', topico];
                })
            );

            autoTable(doc, {
                ...tableConfig,
                startY: y,
                head: [['Disciplina', 'Tópico']],
                body: body,
                 didParseCell: function (data) {
                    // Group rows by discipline by checking for an empty first column
                    if (data.cell.raw === '' && data.column.index === 0) {
                        data.cell.styles.fillColor = BRAND_COLORS.white.rgb;
                    }
                }
            });
        }
        
        doc.save(`${(data.titulo_concurso || 'edital').replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handleExcelExport = () => {
        const wb = XLSX.utils.book_new();

        // --- STYLES ---
        const borderStyle = { style: 'thin' as const, color: { rgb: BRAND_COLORS.border.xlsx } };
        const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

        const headerStyle = {
            font: { bold: true, color: { rgb: BRAND_COLORS.white.xlsx }, sz: 11 },
            fill: { fgColor: { rgb: BRAND_COLORS.headerGreen.xlsx } },
            alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
            border: borders,
        };
        
        const cellStyle = { border: borders, alignment: { vertical: "top" as const, horizontal: "left" as const, wrapText: false } };
        const altRowCellStyle = { ...cellStyle, fill: { fgColor: { rgb: BRAND_COLORS.lightGray.xlsx } } };
        const boldCellStyle = { ...cellStyle, font: { bold: true } };
        const percentageCellStyle = { ...cellStyle, numFmt: "0.0%" };
        const altPercentageCellStyle = { ...altRowCellStyle, numFmt: "0.0%" };


        const applyStylingToSheet = (ws: XLSX.WorkSheet, options: {widths: number[], freezeRow?: boolean, wrappedCols?: number[], extraStyling?: (cell: XLSX.CellObject, R: number, C: number) => void}) => {
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            ws['!rows'] = [{ hpt: 30 }]; 

            if (range.s.r < range.e.r) {
                ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    if (R === 0) { 
                        cell.s = headerStyle;
                    } else { 
                        const isAltRow = R % 2 === 0;
                        let currentStyle = isAltRow ? { ...altRowCellStyle } : { ...cellStyle };
                        
                        if (options.wrappedCols?.includes(C)) {
                            currentStyle.alignment = { ...currentStyle.alignment, wrapText: true };
                        }
                        
                        cell.s = currentStyle;
                    }
                    if (options.extraStyling) {
                        options.extraStyling(cell, R, C);
                    }
                }
            }
            ws['!cols'] = options.widths.map(wch => ({ wch }));
            if (options.freezeRow) {
                ws['!freeze'] = { ySplit: 1 };
            }
        };

        // --- DASHBOARD SHEET ---
        if (data.conteudo_programatico && data.conteudo_programatico.length > 0) {
            const dashboardHeader = [
                'Disciplina', 'Média Sim. 1 (%)', 'Média Sim. 2 (%)', 'Média Sim. 3 (%)', 'Média Sim. 4 (%)', 'Média Sim. 5 (%)', 'Média Geral (%)'
            ];
            const dashboardData = [dashboardHeader];
            
            data.conteudo_programatico.forEach((disciplina, index) => {
                const sanitizedSheetName = (disciplina.disciplina || `Disciplina ${index+1}`).replace(/[\\/?*[\]]/g, '').substring(0, 31);
                const safeSheetName = `'${sanitizedSheetName.replace(/'/g, "''")}'`;
                const numRows = disciplina.topicos?.length || 0;
                const rowNum = index + 2; 

                if (numRows > 0) {
                     const formulas = [
                        `IFERROR(AVERAGE(${safeSheetName}!L2:L${numRows + 1}), "")`,
                        `IFERROR(AVERAGE(${safeSheetName}!M2:M${numRows + 1}), "")`,
                        `IFERROR(AVERAGE(${safeSheetName}!N2:N${numRows + 1}), "")`,
                        `IFERROR(AVERAGE(${safeSheetName}!O2:O${numRows + 1}), "")`,
                        `IFERROR(AVERAGE(${safeSheetName}!P2:P${numRows + 1}), "")`,
                        `IFERROR(AVERAGE(B${rowNum}:F${rowNum}), "")`
                    ];
                    dashboardData.push([disciplina.disciplina || '', ...formulas]);
                }
            });

            const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
            
            const range = XLSX.utils.decode_range(wsDashboard['!ref'] || 'A1');
            for(let R = 1; R <= range.e.r; ++R) {
                const isAltRow = R % 2 === 0;
                wsDashboard[XLSX.utils.encode_cell({r: R, c: 0})].s = isAltRow ? altRowCellStyle : cellStyle;
                for(let C = 1; C <= range.e.c; ++C) {
                     const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                     const cell = wsDashboard[cellAddress];
                     if(cell && cell.v && typeof cell.v === 'string') {
                         cell.t = 'n';
                         cell.f = cell.v.toString();
                         cell.s = isAltRow ? altPercentageCellStyle : percentageCellStyle;
                         delete cell.v;
                     }
                }
            }
            applyStylingToSheet(wsDashboard, { widths: [40, 18, 18, 18, 18, 18, 18] });
            XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");
        }

        // --- INFOS GERAIS SHEET ---
        const infoData = [
            ["Título do Concurso", data.titulo_concurso || 'N/A'],
            ["Organização", data.organizacao || 'N/A'],
            ["Resumo", data.resumo || 'N/A'],
            ["Taxa de Inscrição (R$)", data.taxa_inscricao ?? 'N/A'],
        ];
        const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
        wsInfo['!cols'] = [{ wch: 25 }, { wch: 80 }];
        const infoRange = XLSX.utils.decode_range(wsInfo['!ref'] || 'A1');
        for (let R = infoRange.s.r; R <= infoRange.e.r; ++R) {
            const cellA = wsInfo[XLSX.utils.encode_cell({r: R, c: 0})];
            const cellB = wsInfo[XLSX.utils.encode_cell({r: R, c: 1})];
            if (cellA) cellA.s = boldCellStyle;
            if (cellB) cellB.s = { ...cellStyle, alignment: { ...cellStyle.alignment, wrapText: true } };
        }
        XLSX.utils.book_append_sheet(wb, wsInfo, "Infos Gerais");

        // --- CARGOS SHEET ---
        if (data.cargos && data.cargos.length > 0) {
            const cargosData = data.cargos.map(c => ({
                'Nome do Cargo': c.nome_cargo, 'Vagas': c.vagas, 'Salário (R$)': c.salario,
                'Requisitos': c.requisitos?.join(', '), 'Jornada de Trabalho': c.jornada_trabalho
            }));
            const ws = XLSX.utils.json_to_sheet(cargosData);
            applyStylingToSheet(ws, {widths: [30, 10, 15, 50, 20], freezeRow: true, wrappedCols: [0, 3, 4]});
            XLSX.utils.book_append_sheet(wb, ws, "Cargos");
        }
        
        // --- CRONOGRAMA SHEET ---
        if (data.cronograma && data.cronograma.length > 0) {
            const cronogramaData = data.cronograma.map(c => ({ 'Evento': c.evento, 'Data': c.data }));
            const ws = XLSX.utils.json_to_sheet(cronogramaData);
            applyStylingToSheet(ws, {widths: [40, 20], freezeRow: true, wrappedCols: [0]});
            XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
        }

        // --- DISCIPLINE SHEETS ---
        if (data.conteudo_programatico && data.conteudo_programatico.length > 0) {
            data.conteudo_programatico.forEach((disciplina, index) => {
                if (!disciplina.disciplina || !disciplina.topicos || disciplina.topicos.length === 0) return;
        
                const sheetData = disciplina.topicos.map(topico => ({
                    'Tópico': topico, 'Estudo Concluído': '', 
                    'Seg': '', 'Ter': '', 'Qua': '', 'Qui': '', 'Sex': '', 'Sab': '', 'Dom': '', 
                    'Revisado': '', 'Última Revisão': '',
                    'Simulado 1 (%)': null, 'Simulado 2 (%)': null, 'Simulado 3 (%)': null, 'Simulado 4 (%)': null, 'Simulado 5 (%)': null,
                }));
                
                const ws = XLSX.utils.json_to_sheet(sheetData);
                const widths = [60, 18, 5, 5, 5, 5, 5, 5, 5, 12, 15, 15, 15, 15, 15, 15];
                
                applyStylingToSheet(ws, { 
                    widths, 
                    freezeRow: true, 
                    wrappedCols: [0],
                    extraStyling: (cell, R, C) => {
                        // Columns L to P are Simulado 1 to 5. C is 0-indexed.
                        // L=11, M=12, N=13, O=14, P=15
                        if (C >= 11 && C <= 15 && R > 0) { 
                            if (cell.s) {
                                cell.s.alignment = { ...cell.s.alignment, horizontal: "right" as const };
                                cell.t = 'n';
                                cell.s.numFmt = '0"%"';
                            }
                        }
                    }
                });
                
                // Add Data Validation (Dropdowns) for checkboxes
                const numRows = sheetData.length;
                if (numRows > 0) {
                    if(!ws['!dataValidations']) ws['!dataValidations'] = [];
                    ws['!dataValidations'].push(
                        { sqref: `B2:B${numRows + 1}`, validation: { type: "list", allowBlank: true, showDropDown: true, formulae: ['"Sim,Não"'] } },
                        { sqref: `C2:I${numRows + 1}`, validation: { type: "list", allowBlank: true, showDropDown: true, formulae: ['"X"'] } },
                        { sqref: `J2:J${numRows + 1}`, validation: { type: "list", allowBlank: true, showDropDown: true, formulae: ['"Sim,Não"'] } }
                    );
                }

                const sanitizedSheetName = disciplina.disciplina.replace(/[\\/?*[\]]/g, '').substring(0, 31);
                XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName);
            });
        }

        XLSX.writeFile(wb, `${(data.titulo_concurso || 'edital').replace(/\s+/g, '_').toLowerCase()}.xlsx`);
    };


    return (
        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center text-slate-300">
                <FileDown className="h-5 w-5 mr-2 text-indigo-400"/>
                <span className="font-medium">Exportar edital como:</span>
            </div>
            <div className="flex items-center gap-4">
                 <button onClick={handlePdfExport} className="inline-flex items-center px-4 py-2 bg-slate-700 text-sm font-medium text-slate-200 rounded-md hover:bg-slate-600 transition-colors">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                </button>
                <button onClick={handleExcelExport} className="inline-flex items-center px-4 py-2 bg-slate-700 text-sm font-medium text-slate-200 rounded-md hover:bg-slate-600 transition-colors">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                </button>
            </div>
        </div>
    );
};

export default ExportButtons;
