import { CsvRow, InsertTransaction } from "@shared/schema";

type CsvParserOptions = {
  skipHeader?: boolean;
  dateFormat?: string;
  columnMap?: {
    date: string;
    description: string;
    amount: string;
    category?: string;
    [key: string]: string | undefined;
  };
};

const defaultOptions: CsvParserOptions = {
  skipHeader: true,
  dateFormat: "MM/DD/YYYY",
  columnMap: {
    date: "date",
    description: "description",
    amount: "amount",
    category: "category"
  }
};

// Parse CSV text to array of objects
export function parseCSV(
  csvText: string,
  options: CsvParserOptions = {}
): CsvRow[] {
  const { skipHeader, columnMap } = { ...defaultOptions, ...options };
  
  // Split by lines and filter out empty lines
  const lines = csvText.split("\n").filter(line => line.trim() !== "");
  
  // Skip header if needed
  const dataLines = skipHeader ? lines.slice(1) : lines;
  
  // Find header indices
  const headers = lines[0].split(",").map(h => h.trim());
  const dateIndex = headers.findIndex(h => 
    h.toLowerCase() === (columnMap?.date || "date").toLowerCase());
  const descriptionIndex = headers.findIndex(h => 
    h.toLowerCase() === (columnMap?.description || "description").toLowerCase());
  const amountIndex = headers.findIndex(h => 
    h.toLowerCase() === (columnMap?.amount || "amount").toLowerCase());
  const categoryIndex = columnMap?.category ? 
    headers.findIndex(h => h.toLowerCase() === columnMap.category?.toLowerCase()) : -1;
  
  // Parse data rows
  return dataLines.map(line => {
    const columns = line.split(",").map(c => c.trim());
    
    const row: CsvRow = {
      date: columns[dateIndex],
      description: columns[descriptionIndex],
      amount: columns[amountIndex],
    };
    
    if (categoryIndex >= 0 && columns[categoryIndex]) {
      row.category = columns[categoryIndex];
    }
    
    // Add any other columns as extra data
    headers.forEach((header, i) => {
      if (i !== dateIndex && i !== descriptionIndex && i !== amountIndex && i !== categoryIndex) {
        row[header] = columns[i];
      }
    });
    
    return row;
  });
}

// Convert CSV data to transaction objects
export function csvRowsToTransactions(rows: CsvRow[]): Partial<InsertTransaction>[] {
  return rows.map(row => {
    // Parse the amount and determine if it's income
    let amount = parseFloat(row.amount.replace(/[$,]/g, ""));
    const isIncome = amount > 0;
    
    // Make amount positive for storage
    amount = Math.abs(amount);
    
    // Parse the date
    const dateParts = row.date.split(/[\/\-\.]/);
    let dateObj: Date;
    
    // Try to parse date in MM/DD/YYYY format first
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[0], 10) - 1; // JS months are 0-based
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      // Fallback to Date.parse
      dateObj = new Date(row.date);
    }
    
    // If date is invalid, use current date
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    
    return {
      amount,
      description: row.description,
      date: dateObj.toISOString().split("T")[0], // Format as YYYY-MM-DD
      isIncome
    };
  });
}

// Helper to detect CSV format based on content
export function detectCsvFormat(csvText: string): string {
  const firstLine = csvText.split("\n")[0].toLowerCase();
  
  if (firstLine.includes("chase") || firstLine.includes("post date")) {
    return "chase";
  } else if (firstLine.includes("bank of america") || firstLine.includes("boa")) {
    return "bank_of_america";
  } else if (firstLine.includes("wells fargo") || firstLine.includes("wells")) {
    return "wells_fargo";
  } else {
    return "generic";
  }
}

// Get column mappings for known bank formats
export function getBankColumnMap(bankFormat: string): CsvParserOptions["columnMap"] {
  switch (bankFormat) {
    case "chase":
      return {
        date: "Post Date",
        description: "Description",
        amount: "Amount"
      };
    case "bank_of_america":
      return {
        date: "Date",
        description: "Payee",
        amount: "Amount"
      };
    case "wells_fargo":
      return {
        date: "Date",
        description: "Description",
        amount: "Amount"
      };
    default:
      return defaultOptions.columnMap;
  }
}

// Upload and parse CSV
export async function uploadAndParseCSV(file: File): Promise<{rows: CsvRow[], transactions: Partial<InsertTransaction>[]}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const bankFormat = detectCsvFormat(csvText);
        const columnMap = getBankColumnMap(bankFormat);
        
        const rows = parseCSV(csvText, { 
          skipHeader: true,
          columnMap
        });
        
        const transactions = csvRowsToTransactions(rows);
        
        resolve({ rows, transactions });
      } catch (error) {
        reject(new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
}
