import PDFDocument from "pdfkit";
import type { ImprovedResumeResult } from "./geminiService";

const COLORS = {
  primary: "#D45A00",
  heading: "#1a1a1a",
  body: "#333333",
  muted: "#666666",
  line: "#E0E0E0",
};

function drawLine(doc: InstanceType<typeof PDFDocument>, y: number) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(COLORS.line).stroke();
}

function sectionHeading(doc: InstanceType<typeof PDFDocument>, title: string) {
  doc.moveDown(0.6);
  doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.primary).text(title.toUpperCase());
  drawLine(doc, doc.y + 2);
  doc.moveDown(0.4);
}

export function generateResumePDF(
  data: ImprovedResumeResult,
  userName: string,
  userEmail: string
): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 55, right: 55 },
    info: { Title: `${userName} - Resume`, Author: userName },
  });

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --- Name & Contact ---
  doc.fontSize(24).font("Helvetica-Bold").fillColor(COLORS.heading).text(userName, { align: "center" });
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.muted).text(userEmail, { align: "center" });
  doc.moveDown(0.5);

  // --- Summary ---
  if (data.summary) {
    sectionHeading(doc, "Professional Summary");
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.body).text(data.summary, { lineGap: 2 });
  }

  // --- Experience ---
  if (data.experience.length > 0) {
    sectionHeading(doc, "Experience");
    for (const exp of data.experience) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.heading).text(exp.title, {
        continued: exp.company ? true : false,
      });
      if (exp.company) {
        doc.font("Helvetica").fillColor(COLORS.muted).text(`  |  ${exp.company}`);
      }
      if (exp.duration) {
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted).text(exp.duration);
      }
      doc.moveDown(0.2);

      for (const bullet of exp.bullets) {
        doc.fontSize(10).font("Helvetica").fillColor(COLORS.body).text(`•  ${bullet}`, {
          indent: 10,
          lineGap: 1.5,
        });
      }
      doc.moveDown(0.4);
    }
  }

  // --- Projects ---
  if (data.projects.length > 0) {
    sectionHeading(doc, "Projects");
    for (const proj of data.projects) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.heading).text(proj.name);
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.body).text(proj.description, { lineGap: 1.5 });
      if (proj.technologies.length > 0) {
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.primary).text(
          `Tech: ${proj.technologies.join(", ")}`
        );
      }
      doc.moveDown(0.3);
    }
  }

  // --- Skills ---
  if (data.skills.length > 0) {
    sectionHeading(doc, "Skills");
    for (const group of data.skills) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.heading).text(`${group.category}: `, {
        continued: true,
      });
      doc.font("Helvetica").fillColor(COLORS.body).text(group.items.join(", "));
      doc.moveDown(0.15);
    }
  }

  // --- Education ---
  if (data.education.length > 0) {
    sectionHeading(doc, "Education");
    for (const edu of data.education) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.heading).text(edu.degree, {
        continued: edu.institution ? true : false,
      });
      if (edu.institution) {
        doc.font("Helvetica").fillColor(COLORS.muted).text(`  —  ${edu.institution}`);
      }
      if (edu.year) {
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted).text(edu.year);
      }
      doc.moveDown(0.2);
    }
  }

  // --- Certifications ---
  if (data.certifications.length > 0) {
    sectionHeading(doc, "Certifications");
    for (const cert of data.certifications) {
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.body).text(`•  ${cert}`, { indent: 10 });
    }
  }

  doc.end();
  return doc;
}
