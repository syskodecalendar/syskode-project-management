import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { documentService } from './documentService';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 23;
const RIGHT_MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN_X - RIGHT_MARGIN;
const CONTENT_BOTTOM = 274;

const SOFT_BLUE = [247, 251, 254];
const NAVY = [7, 26, 53];
const NAVY_2 = [12, 32, 56];
const BRAND_BLUE = [0, 174, 239];
const BRAND_BLUE_DARK = [7, 136, 201];
const BORDER_BLUE = [184, 221, 242];
const INK = [16, 24, 40];
const MUTED = [102, 112, 133];
const LINE = [220, 231, 239];
const LIGHT = [251, 253, 255];
const WHITE = [255, 255, 255];

const LIGHT_LOGO_URL = '/images/syskode-logo-light.png';
const DARK_LOGO_URL = '/images/syskode-logo-dark.png';

function safeFileName(name) {
    return (name || 'Syskode-Proposal').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-');
}

async function loadImageAsDataUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok)
            return null;
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }
    catch {
        return null;
    }
}

async function loadBrandAssets() {
    const [lightLogo, darkLogo] = await Promise.all([
        loadImageAsDataUrl(LIGHT_LOGO_URL),
        loadImageAsDataUrl(DARK_LOGO_URL),
    ]);
    return { lightLogo, darkLogo };
}

async function pathToDataUrl(path) {
    if (!path)
        return null;
    const signedUrl = await documentService.getAssetUrl(path);
    if (!signedUrl)
        return null;
    const response = await fetch(signedUrl);
    if (!response.ok)
        return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

function setOpacity(doc, opacity) {
    try {
        if (doc.GState && doc.setGState) {
            doc.setGState(new doc.GState({ opacity }));
            return true;
        }
    }
    catch {
        // Continue without opacity support.
    }
    return false;
}

function resetOpacity(doc) {
    try {
        if (doc.GState && doc.setGState)
            doc.setGState(new doc.GState({ opacity: 1 }));
    }
    catch {
        // No-op.
    }
}

function addLogo(doc, dataUrl, x, y, width, height) {
    if (!dataUrl)
        return;
    try {
        doc.addImage(dataUrl, 'PNG', x, y, width, height, undefined, 'FAST');
    }
    catch {
        // Keep the PDF export usable even if a browser cannot decode an asset.
    }
}

function drawWatermark(doc, branding) {
    if (!branding?.darkLogo)
        return;
    const supported = setOpacity(doc, 0.055);
    addLogo(doc, branding.darkLogo, 58, 135, 95, 18);
    if (supported)
        resetOpacity(doc);
}

function drawBorderWithoutLeft(doc, leftStart = 8) {
    const inset = 4;
    const x1 = PAGE_W - inset;
    const y0 = inset;
    const y1 = PAGE_H - inset;
    const r = 2;

    doc.setDrawColor(BORDER_BLUE[0], BORDER_BLUE[1], BORDER_BLUE[2]);
    doc.setLineWidth(0.28);

    // No left-side line. The top and bottom begin after the dark split panel / strip.
    doc.line(leftStart, y1, x1 - r, y1);
    doc.roundedRect(x1 - (r * 2), y1 - (r * 2), r * 2, r * 2, r, r, 'S');
    doc.setFillColor(SOFT_BLUE[0], SOFT_BLUE[1], SOFT_BLUE[2]);
    doc.rect(x1 - (r * 2) - 0.5, y1 - (r * 2) - 0.5, r * 2 + 1, r + 0.9, 'F');
    doc.setDrawColor(BORDER_BLUE[0], BORDER_BLUE[1], BORDER_BLUE[2]);
    doc.line(x1, y0 + r, x1, y1 - r);
    doc.roundedRect(x1 - (r * 2), y0, r * 2, r * 2, r, r, 'S');
    doc.setFillColor(SOFT_BLUE[0], SOFT_BLUE[1], SOFT_BLUE[2]);
    doc.rect(x1 - (r * 2) - 0.5, y0 + r - 0.2, r * 2 + 1, r + 0.9, 'F');
    doc.setDrawColor(BORDER_BLUE[0], BORDER_BLUE[1], BORDER_BLUE[2]);
    doc.line(x1 - r, y0, leftStart, y0);
}

function drawPageBase(doc, proposal, continuationTitle, branding) {
    doc.setFillColor(SOFT_BLUE[0], SOFT_BLUE[1], SOFT_BLUE[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    drawWatermark(doc, branding);

    // Split-layout accent strip on content pages.
    doc.setFillColor(NAVY_2[0], NAVY_2[1], NAVY_2[2]);
    doc.rect(0, 0, 8, PAGE_H, 'F');
    drawBorderWithoutLeft(doc, 8);

    // Small actual Syskode logo on inner pages.
    addLogo(doc, branding?.darkLogo, 19, 10.4, 31, 5.7);

    if (continuationTitle) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(continuationTitle.toUpperCase(), PAGE_W - RIGHT_MARGIN, 14, { align: 'right', maxWidth: 112 });
    }

    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.3);
    doc.line(54, 16, PAGE_W - RIGHT_MARGIN, 16);
    doc.line(MARGIN_X, PAGE_H - 15, PAGE_W - RIGHT_MARGIN, PAGE_H - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('www.syskode.com', MARGIN_X, PAGE_H - 9.6);
}

function addContentPage(doc, proposal, continuationTitle, branding) {
    doc.addPage();
    drawPageBase(doc, proposal, continuationTitle, branding);
    return 31;
}

function drawSectionHeader(doc, title, y = 31) {
    const lines = doc.splitTextToSize(title || 'Proposal', CONTENT_W - 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(lines.length > 1 ? 19 : 22);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(lines, MARGIN_X, y);
    const bottom = y + Math.max(8, lines.length * 8.3);

    doc.setDrawColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_X, bottom + 2, MARGIN_X + 20, bottom + 2);

    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X + 23, bottom + 2, PAGE_W - RIGHT_MARGIN, bottom + 2);
    return bottom + 12;
}

function ensureSpace(doc, proposal, sectionName, y, needed, branding) {
    if (y + needed <= CONTENT_BOTTOM)
        return y;
    return addContentPage(doc, proposal, `${sectionName} - Continued`, branding);
}

async function drawSignatureAt(doc, block, x, y, width) {
    const signature = await pathToDataUrl(block.signatureImagePath);
    let cursor = y;
    if (signature) {
        const props = doc.getImageProperties(signature);
        const ratio = props.width / props.height || 2;
        const height = 17;
        const imageWidth = Math.min(width - 5, height * ratio);
        doc.addImage(signature, x, cursor, imageWidth, height, undefined, 'FAST');
        cursor += 20;
    }
    else {
        cursor += 18;
    }
    doc.setDrawColor(126, 146, 160);
    doc.setLineWidth(0.3);
    doc.line(x, cursor, x + width, cursor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.4);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(block.signatoryName || 'Authorized Signatory', x, cursor + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.7);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const titleLines = doc.splitTextToSize(block.signatoryTitle || '', width);
    if (titleLines.length)
        doc.text(titleLines, x, cursor + 9.5);
    return cursor + 10 + titleLines.length * 3.8;
}

async function drawBlock(doc, proposal, sectionName, block, y, branding) {
    if (block.type === 'heading') {
        const lines = doc.splitTextToSize(block.text || 'Heading', CONTENT_W);
        y = ensureSpace(doc, proposal, sectionName, y, 11 + lines.length * 7, branding);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text(lines, MARGIN_X, y);
        return y + lines.length * 7 + 4;
    }
    if (block.type === 'subheading') {
        const lines = doc.splitTextToSize(block.text || 'Subheading', CONTENT_W);
        y = ensureSpace(doc, proposal, sectionName, y, 9 + lines.length * 5.5, branding);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.2);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text(lines, MARGIN_X, y);
        return y + lines.length * 5.5 + 4;
    }
    if (block.type === 'paragraph') {
        const paragraphs = String(block.text || '').split(/\n\s*\n/);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.6);
        doc.setTextColor(48, 58, 72);
        for (const paragraph of paragraphs) {
            if (!paragraph.trim())
                continue;
            const lines = doc.splitTextToSize(paragraph.trim(), CONTENT_W);
            for (const line of lines) {
                y = ensureSpace(doc, proposal, sectionName, y, 6, branding);
                doc.text(line, MARGIN_X, y);
                y += 5.05;
            }
            y += 3.2;
        }
        return y;
    }
    if (block.type === 'points') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(48, 58, 72);
        for (const point of (block.points || []).filter(Boolean)) {
            const lines = doc.splitTextToSize(point, CONTENT_W - 10);
            y = ensureSpace(doc, proposal, sectionName, y, Math.max(7, lines.length * 5.1 + 1), branding);
            doc.setFillColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
            doc.circle(MARGIN_X + 2.8, y - 1.3, 0.72, 'F');
            doc.text(lines, MARGIN_X + 8, y);
            y += lines.length * 5.1 + 2;
        }
        return y + 1;
    }
    if (block.type === 'table') {
        const headers = (block.tableHeaders || []).map(h => h || 'Column');
        const rows = (block.tableRows || []).map(row => headers.map((_, i) => row?.[i] ?? ''));
        if (!headers.length)
            return y;
        y = ensureSpace(doc, proposal, sectionName, y, 27, branding);
        if (block.tableCaption) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.2);
            doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.text(block.tableCaption, MARGIN_X, y);
            y += 6;
        }
        const startPage = doc.internal.getCurrentPageInfo().pageNumber;
        autoTable(doc, {
            startY: y,
            head: [headers],
            body: rows,
            margin: { left: MARGIN_X, right: RIGHT_MARGIN, top: 31, bottom: 24 },
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 8.6,
                cellPadding: 3.1,
                textColor: [45, 55, 68],
                lineColor: [196, 213, 224],
                lineWidth: 0.22,
                valign: 'top',
            },
            headStyles: {
                fillColor: NAVY_2,
                textColor: WHITE,
                fontStyle: 'bold',
                lineColor: [60, 89, 111],
                lineWidth: 0.3,
            },
            alternateRowStyles: { fillColor: LIGHT },
            willDrawPage: () => {
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                if (currentPage > startPage)
                    drawPageBase(doc, proposal, `${sectionName} - Continued`, branding);
            },
        });
        return (doc.lastAutoTable?.finalY || y + 20) + 8;
    }
    if (block.type === 'image') {
        const dataUrl = await pathToDataUrl(block.imagePath);
        if (!dataUrl)
            return y;
        const props = doc.getImageProperties(dataUrl);
        const ratio = props.width / props.height || 1;
        let width = Math.min(CONTENT_W, 160);
        let height = width / ratio;
        if (height > 115) {
            height = 115;
            width = height * ratio;
        }
        y = ensureSpace(doc, proposal, sectionName, y, height + 15, branding);
        const x = MARGIN_X + (CONTENT_W - width) / 2;
        doc.addImage(dataUrl, x, y, width, height, undefined, 'FAST');
        y += height + 3;
        if (block.imageAlt) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.8);
            doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            doc.text(block.imageAlt, MARGIN_X + CONTENT_W / 2, y + 2, { align: 'center', maxWidth: CONTENT_W });
            y += 6;
        }
        return y + 3;
    }
    if (block.type === 'signature') {
        y = ensureSpace(doc, proposal, sectionName, y, 45, branding);
        return (await drawSignatureAt(doc, block, MARGIN_X, y, 63)) + 5;
    }
    return y;
}

async function drawSignaturePair(doc, proposal, sectionName, left, right, y, branding) {
    y = ensureSpace(doc, proposal, sectionName, y, 50, branding);
    const gap = 16;
    const width = (CONTENT_W - gap) / 2;
    const leftBottom = await drawSignatureAt(doc, left, MARGIN_X, y, width);
    const rightBottom = await drawSignatureAt(doc, right, MARGIN_X + width + gap, y, width);
    return Math.max(leftBottom, rightBottom) + 7;
}

function drawCover(doc, proposal, branding) {
    doc.setFillColor(SOFT_BLUE[0], SOFT_BLUE[1], SOFT_BLUE[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    drawWatermark(doc, branding);

    // Strong left split panel.
    doc.setFillColor(NAVY_2[0], NAVY_2[1], NAVY_2[2]);
    doc.rect(0, 0, 72, PAGE_H, 'F');
    drawBorderWithoutLeft(doc, 72);

    // Actual Syskode logo on the navy panel.
    addLogo(doc, branding?.lightLogo, 12, 21, 48, 16);
    doc.setFillColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
    doc.rect(16, 42, 34, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text(proposal.proposalNumber || 'SYS/PROP/-', 16, 50);

    const title = proposal.documentName || 'Business Proposal';
    const titleLines = doc.splitTextToSize(title, 103);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleLines.length > 3 ? 20 : titleLines.length > 2 ? 22 : 25);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(titleLines, 88, 71);

    const titleEnd = 71 + titleLines.length * 9.3;
    const clientLabel = proposal.companyName || proposal.clientName || 'Client';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.1);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Project proposal for ${clientLabel}`, 88, titleEnd + 7, { maxWidth: 102 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(BRAND_BLUE_DARK[0], BRAND_BLUE_DARK[1], BRAND_BLUE_DARK[2]);
    doc.text('PREPARED FOR', 88, 192);
    doc.setFontSize(10.7);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(clientLabel, 88, 202, { maxWidth: 95 });
    if (proposal.clientName && proposal.clientName !== clientLabel) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(proposal.clientName, 88, 209, { maxWidth: 95 });
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(proposal.preparedForLocation || 'Kingdom of Bahrain', 88, 216, { maxWidth: 95 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(BRAND_BLUE_DARK[0], BRAND_BLUE_DARK[1], BRAND_BLUE_DARK[2]);
    doc.text('PREPARED BY', 88, 236);
    doc.setFontSize(10.7);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('Syskode Technologies W.L.L.', 88, 246, { maxWidth: 95 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Kingdom of Bahrain', 88, 253);
    if (proposal.proposalDate)
        doc.text(proposal.proposalDate, 88, 260);
}

function addFinalPageNumbers(doc) {
    const total = doc.getNumberOfPages();
    for (let page = 2; page <= total; page += 1) {
        doc.setPage(page);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(`Page ${page} of ${total}`, PAGE_W - RIGHT_MARGIN, PAGE_H - 9.6, { align: 'right' });
    }
}

export const proposalExportService = {
    async exportToPdf(proposal) {
        const branding = await loadBrandAssets();
        const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
        drawCover(doc, proposal, branding);

        const sections = proposal.builderSections || [];
        for (const section of sections) {
            let y = addContentPage(doc, proposal, undefined, branding);
            y = drawSectionHeader(doc, section.name, y);
            const blocks = section.blocks || [];
            for (let i = 0; i < blocks.length; i += 1) {
                const block = blocks[i];
                if (block.type === 'heading' && String(block.text || '').trim().toLowerCase() === String(section.name || '').trim().toLowerCase())
                    continue;
                const next = blocks[i + 1];
                if (block.type === 'signature' && next?.type === 'signature') {
                    y = await drawSignaturePair(doc, proposal, section.name, block, next, y, branding);
                    i += 1;
                    continue;
                }
                y = await drawBlock(doc, proposal, section.name, block, y, branding);
            }
        }

        if (!sections.length) {
            let y = addContentPage(doc, proposal, undefined, branding);
            y = drawSectionHeader(doc, 'Proposal', y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            doc.text('No proposal sections have been added yet.', MARGIN_X, y);
        }

        addFinalPageNumbers(doc);
        doc.save(`${safeFileName(proposal.documentName)}.pdf`);
    },
};
