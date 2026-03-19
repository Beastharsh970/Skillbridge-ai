declare module "pdfkit" {
  import { Writable } from "stream";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    info?: Record<string, string>;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, options?: any): this;
    text(text: string, x: number, y: number, options?: any): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: string): this;
    strokeColor(color: string): this;
    fillColor(color: string): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    addPage(options?: any): this;
    end(): void;
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    x: number;
    y: number;
    page: { width: number; height: number; margins: { left: number; right: number; top: number; bottom: number } };
  }

  export = PDFDocument;
}
