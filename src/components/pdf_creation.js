import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';

// ----------------------------------------------------------------------
// CONSTANTS & CONFIG
// ----------------------------------------------------------------------

const COLORS = {
    // Brand / Neutral
    text: [24, 24, 27],        // Zinc 900
    secondary: [113, 113, 122],// Zinc 500
    border: [228, 228, 231],   // Zinc 200
    bgLight: [250, 250, 250],  // Zinc 50
    white: [255, 255, 255],

    // Semantic
    emerald: [16, 185, 129],   // Emerald 500
    emeraldLight: [209, 250, 229], // Emerald 100
    rose: [244, 63, 94],       // Rose 500
    roseLight: [255, 228, 230], // Rose 100

    // UI
    brandBlue: [2, 83, 228],
};

const GEOM = {
    pageW: 8.27,      // A4 Width (in)
    pageH: 11.69,     // A4 Height (in)
    margin: 0.6,      // Page Margin
    cardRadius: 0.15, // Border radius for boxes
};

const CONTENT_WIDTH = GEOM.pageW - (2 * GEOM.margin);

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

// Draw a chic rounded card
const drawCard = (doc, x, y, w, h, color = COLORS.white) => {
    doc.setFillColor(...color);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(1 / 72); // Thin stroke
    doc.roundedRect(x, y, w, h, GEOM.cardRadius, GEOM.cardRadius, 'FD');
};

// Draw a status badge (e.g., "Authentic")
const drawBadge = (doc, text, x, y, type = "neutral") => {
    const fontSize = 10;
    doc.setFontSize(fontSize);
    doc.setFont("Outfit", "bold");

    const textW = doc.getTextWidth(text);
    const padX = 0.15;
    const padY = 0.05;
    const badgeW = textW + (padX * 2);
    const badgeH = (fontSize / 72) + (padY * 2) + 0.02;

    let bgColor = COLORS.bgLight;
    let textColor = COLORS.secondary;

    if (type === "success") {
        bgColor = COLORS.emeraldLight;
        textColor = [6, 95, 70]; // Emerald 800
    } else if (type === "danger") {
        bgColor = COLORS.roseLight;
        textColor = [136, 19, 55]; // Rose 900
    }

    doc.setFillColor(...bgColor);
    doc.setDrawColor(...bgColor); // No border or same color
    doc.roundedRect(x, y - (fontSize / 72) - padY + 0.05, badgeW, badgeH, 0.05, 0.05, 'F');

    doc.setTextColor(...textColor);
    doc.text(text, x + padX, y + 0.05);

    return badgeW; // Returns width for layout
};

// ----------------------------------------------------------------------
// MAIN EXPORT FUNCTION
// ----------------------------------------------------------------------

export const video_pdf = async (analysisTypes, results, result_values, file_metadata, audio_graph_Ref, frame_person_refs) => {

    if (!results || !result_values) {
        console.error("Analysis results are not ready for export.");
        return;
    }

    const doc = new jsPDF({ orientation: "p", unit: "in", compress: true });

    // 1. Setup Fonts
    doc.addFileToVFS('outfit_normal.ttf', Outfit_normal_font);
    doc.addFileToVFS('outfit_bold.ttf', Outfit_bold_font);
    doc.addFont('outfit_normal.ttf', 'Outfit', 'normal');
    doc.addFont('outfit_bold.ttf', 'Outfit', 'bold');

    let curr_y = GEOM.margin;
    let curr_x = GEOM.margin;

    // ============================================
    // HEADER
    // ============================================

    // Logo
    const logoSize = 0.5;
    doc.addImage(logo_base64, 'PNG', curr_x, curr_y - 0.1, logoSize, logoSize);

    // Company Name
    curr_x += logoSize + 0.15;
    doc.setFont("Outfit", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.brandBlue);
    doc.text('Contrails AI', curr_x, curr_y + 0.25);

    // Report Title (Right Aligned)
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.text);
    const title = "Deepfake Analysis Report";
    doc.text(title, GEOM.pageW - GEOM.margin - doc.getTextWidth(title), curr_y + 0.25);

    curr_y += 0.8;
    curr_x = GEOM.margin;

    // Horizontal Line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(1 / 72);
    doc.line(curr_x, curr_y, GEOM.pageW - GEOM.margin, curr_y);
    curr_y += 0.4;

    // ============================================
    // FILE METADATA SECTION
    // ============================================

    doc.setFontSize(12);
    doc.setFont("Outfit", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("File Overview", curr_x, curr_y);
    curr_y += 0.2;

    const metaCardH = 1.6;
    drawCard(doc, curr_x, curr_y, CONTENT_WIDTH, metaCardH, COLORS.bgLight);

    // Inside Metadata Card
    let metaY = curr_y + 0.4;
    let metaX = curr_x + 0.3;

    // Helper for key-value pair
    const drawMetaItem = (label, value, x, y) => {
        doc.setFontSize(9);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.secondary);
        doc.text(label.toUpperCase(), x, y);

        doc.setFontSize(11);
        doc.setFont("Outfit", "normal");
        doc.setTextColor(...COLORS.text);

        // Handle long filenames with simple split
        if (doc.getTextWidth(value) > 3.5) {
            const splitText = doc.splitTextToSize(value, 3.5);
            doc.text(splitText, x, y + 0.2);
        } else {
            doc.text(value, x, y + 0.2);
        }
    };

    drawMetaItem("Filename", file_metadata.name, metaX, metaY);
    drawMetaItem("File Size", file_metadata.size, metaX + 4.0, metaY); // Column 2

    metaY += 0.7;
    drawMetaItem("Date Analysis", new Date().toLocaleDateString(), metaX, metaY);
    drawMetaItem("File Type", file_metadata.type || "Unknown", metaX + 4.0, metaY);

    curr_y += metaCardH + 0.4;

    // ============================================
    // EXPERT COMMENT (If Exists)
    // ============================================
    if (file_metadata.verifier_comment) {
        console.log("Printing Verifier Comment:", file_metadata.verifier_comment);

        doc.setFontSize(12);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.text);
        doc.text("Expert's Comment", curr_x, curr_y);
        curr_y += 0.2;

        doc.setFontSize(10);
        doc.setFont("Outfit", "normal");

        // Ensure text color is set to dark/black explicitly before printing on white card
        doc.setTextColor(0, 0, 0);

        const commentLines = doc.splitTextToSize(file_metadata.verifier_comment, CONTENT_WIDTH - 0.4);
        // Calculate dynamic height based on lines (approx 0.2 unit per line) + padding
        const commentH = (commentLines.length * 0.2) + 0.4;

        drawCard(doc, curr_x, curr_y, CONTENT_WIDTH, commentH, COLORS.white);

        // Adjust text position: x + padding, y + header padding + baseline offset
        doc.text(commentLines, curr_x + 0.2, curr_y + 0.35);

        curr_y += commentH + 0.4;
    }

    // ============================================
    // HELPER: ANALYSIS HEADER (Consistent UI)
    // ============================================
    const drawAnalysisHeader = (title, isReal, score, imageBase64 = null) => {
        const headerH = 0.8;
        const startY = curr_y;

        // Background for header
        // drawCard(doc, curr_x, curr_y, CONTENT_WIDTH, headerH, COLORS.white); // Optional: card background

        let contentX = curr_x;

        // 1. Thumbnail Image (if exists)
        if (imageBase64) {
            const imgSize = 0.6;
            // Mask circle? jsPDF doesn't do circle clipping easily. We'll do a rounded rect or just a rect.
            // A rounded rect clip is possible but complex. Let's do a nice rounded square.
            try {
                doc.setDrawColor(...COLORS.border);
                doc.roundedRect(contentX, curr_y, imgSize, imgSize, 0.15, 0.15, 'S');
                // We can't easily clip to rounded rect in jsPDF purely with addImage.
                // We will just draw the image inside.
                doc.addImage(imageBase64, 'JPEG', contentX + 0.02, curr_y + 0.02, imgSize - 0.04, imgSize - 0.04);
            } catch (e) {
                console.warn("Could not draw face image", e);
            }
            contentX += imgSize + 0.25;
        }

        // 2. Title and Badge (Stacked or Inline)
        doc.setFontSize(14);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.text);
        doc.text(title, contentX, curr_y + 0.25);

        drawBadge(doc, isReal ? "AUTHENTIC" : "SUSPICIOUS", contentX, curr_y + 0.5, isReal ? "success" : "danger");

        // 3. Confidence Score (Right Aligned)
        doc.setFontSize(10);
        doc.setFont("Outfit", "normal");
        doc.setTextColor(...COLORS.secondary);
        const labelText = "CONFIDENCE";
        doc.text(labelText, GEOM.pageW - GEOM.margin - doc.getTextWidth(labelText), curr_y + 0.25);

        doc.setFontSize(22);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.text);
        const scoreText = `${score}%`;
        doc.text(scoreText, GEOM.pageW - GEOM.margin - doc.getTextWidth(scoreText), curr_y + 0.6);

        curr_y += headerH + 0.2;
    };

    doc.setFontSize(12);
    doc.setFont("Outfit", "bold");
    doc.text("Executive Summary", curr_x, curr_y);
    curr_y += 0.2;

    // Determine Overall Status for a big banner
    // Logic: If ANY check fails (is suspicious), overall is suspicious.
    let overallReal = true;
    let overallScore = 0;

    const analysisKeys = ["audioAnalysis", "frameCheck"];
    let scores = [];

    analysisKeys.forEach(key => {
        if (result_values[key]) {
            let isReal = false;
            let score = 0;
            if (key === "audioAnalysis") {
                isReal = result_values[key].prediction;
                score = Number(result_values[key].percentage);
            } else if (key === "frameCheck") {
                // For frames, take the worst or first? Usually worst prediction.
                // result_values["frameCheck"] is an object of labels.
                const labels = Object.keys(result_values["frameCheck"]);
                if (labels.length > 0) {
                    // Find if any label is fake
                    const fakeLabel = labels.find(l => !result_values["frameCheck"][l].prediction);
                    if (fakeLabel) {
                        isReal = false;
                        score = Number(result_values["frameCheck"][fakeLabel].percentage);
                    } else {
                        // All real, take lowest confidence? or first.
                        isReal = true;
                        score = Number(result_values["frameCheck"][labels[0]].percentage);
                    }
                }
            }

            if (!isReal) overallReal = false;
            scores.push(score);
        }
    });

    const summaryHeight = 1.2;
    // bg color based on verdict
    const bannerColor = overallReal ? COLORS.emeraldLight : COLORS.roseLight;
    const bannerBorder = overallReal ? [6, 95, 70] : [136, 19, 55]; // darker shade

    doc.setFillColor(...bannerColor);
    doc.setDrawColor(...bannerColor);
    doc.roundedRect(curr_x, curr_y, CONTENT_WIDTH, summaryHeight, 0.2, 0.2, "F");

    // Banner Text
    doc.setFontSize(16);
    doc.setFont("Outfit", "bold");
    doc.setTextColor(...bannerBorder);
    const verdictText = overallReal ? "NO MANIPULATION DETECTED" : "POTENTIAL MANIPULATION DETECTED";
    doc.text(verdictText, curr_x + 0.3, curr_y + 0.5);

    doc.setFontSize(11);
    doc.setFont("Outfit", "normal");
    doc.text(overallReal ? "The analysis indicates the media is likely authentic." : "The analysis detected signs of synthetic manipulation.", curr_x + 0.3, curr_y + 0.8);

    curr_y += summaryHeight + 0.5;

    // ============================================
    // DETAILED ANALYSIS SECTIONS
    // ============================================

    // HELPER: New Page Trigger
    const checkPageBreak = (neededHeight) => {
        if (curr_y + neededHeight > GEOM.pageH - GEOM.margin) {
            doc.addPage();
            curr_y = GEOM.margin;
            return true;
        }
        return false;
    };

    // 1. AUDIO ANALYSIS
    if (result_values["audioAnalysis"] && audio_graph_Ref.current) {
        doc.addPage();
        curr_y = GEOM.margin;

        // Header
        doc.setFontSize(16);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.text); // Section Title Color
        doc.text("Audio Analysis", curr_x, curr_y);
        curr_y += 0.4;

        // Data
        const audData = result_values["audioAnalysis"];
        const isReal = audData.prediction;
        const confScore = isReal ? audData.percentage : (100 - Number(audData.percentage)).toFixed(2);

        // Use Consistent Header (No image for audio typically)
        drawAnalysisHeader("Audio Stream", isReal, confScore, null);

        // Capture Graph
        try {
            const canvas = await html2canvas(audio_graph_Ref.current);
            const imgData = canvas.toDataURL('image/png');
            const imgW = CONTENT_WIDTH; // Full width
            const imgH = (canvas.height * imgW) / canvas.width;

            // Draw clean border around graph
            doc.setDrawColor(...COLORS.border);
            doc.rect(curr_x, curr_y, imgW, imgH, 'S');
            doc.addImage(imgData, 'PNG', curr_x, curr_y, imgW, imgH, '', 'FAST');

            curr_y += imgH + 0.4;
        } catch (e) {
            console.error("Audio graph capture failed", e);
            doc.text("[Graph Caption Failed]", curr_x, curr_y);
            curr_y += 0.5;
        }
    }

    // 2. FRAME ANALYSIS
    if (result_values["frameCheck"]) {
        doc.addPage();
        curr_y = GEOM.margin;

        doc.setFontSize(16);
        doc.setFont("Outfit", "bold");
        doc.setTextColor(...COLORS.text);
        doc.text("Visual Analysis", curr_x, curr_y);
        curr_y += 0.4;

        // Iterate through top 3 faces as per UI
        const sortedLabels = Object.keys(result_values["frameCheck"])
            // Logic must match UI exactly to align with refs
            // UI: filter face_labels -> sort -> slice(0,3)
            .filter((v) => !results["face_labels"] || results["face_labels"].length === 0 || results["face_labels"].includes(v))
            .sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"])
            .slice(0, 3);

        for (let i = 0; i < sortedLabels.length; i++) {
            const label = sortedLabels[i];
            const data = result_values["frameCheck"][label];
            const ref = frame_person_refs[i];

            if (!data || !ref.current) continue;

            const isReal = data.prediction;
            const confScore = isReal ? data.percentage : (100 - Number(data.percentage)).toFixed(2);

            // Get Face Image
            // Ensure we handle potential data URI prefix differences if any, 
            // but usually `results.frameCheck.label_faces[label]` is a full data:image/jpeg;base64... string or URL.
            // If it is a URL, addImage supports it if it's not CORS restricted.
            // Since this runs client side, data URIs are safest.
            const faceImage = results?.frameCheck?.label_faces ? results.frameCheck.label_faces[label] : null;

            checkPageBreak(5); // Header + Graph

            // Use Consistent Header
            drawAnalysisHeader(`Subject ${i + 1}`, isReal, confScore, faceImage);

            try {
                const canvas = await html2canvas(ref.current);
                const imgData = canvas.toDataURL('image/png');
                const imgW = CONTENT_WIDTH;
                const imgH = (canvas.height * imgW) / canvas.width;

                // doc.setDrawColor(...COLORS.border);
                // doc.rect(curr_x, curr_y, imgW, imgH, 'S');
                doc.addImage(imgData, 'PNG', curr_x, curr_y, imgW, imgH, '', 'FAST');

                curr_y += imgH + 0.4;
            } catch (e) {
                console.error("Frame graph capture failed", e);
            }
        }
    }

    // Save
    doc.save(`${file_metadata.name}_Report.pdf`);
};