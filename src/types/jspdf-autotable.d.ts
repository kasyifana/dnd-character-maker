declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  type AutoTableOptions = any;
  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
