declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFInfo {
    Title?: string
    Author?: string
    PDFFormatVersion?: string
    Producer?: string
    Creator?: string
    CreationDate?: string
    ModDate?: string
    [key: string]: any
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: any
    text: string
    version: string
  }

  function PDFParse(dataBuffer: Buffer, options?: {
    pagerender?: (pageData: any) => string
    max?: number
    version?: string
  }): Promise<PDFData>

  export default PDFParse
} 