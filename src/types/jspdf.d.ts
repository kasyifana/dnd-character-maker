declare module 'jspdf' {
  // Minimal typings to satisfy usage in generatePDF.tsx
  export default class jsPDF {
    constructor(options?: any);
    setFont(fontName: string, fontStyle?: string): this;
    setFontSize(size: number): this;
    text(text: string | string[], x: number, y: number): this;
    splitTextToSize(text: string, maxSize: number): string[];
    addPage(format?: string | string[], orientation?: string): this;
    setTextColor(r: number): this;
    save(filename?: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}
