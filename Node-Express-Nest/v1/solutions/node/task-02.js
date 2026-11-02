const fs = require("fs");
const path = require("path");
const { Transform } = require("stream");
const { StringDecoder } = require("string_decoder");
const { pipeline } = require("stream/promises");

class CSVParser extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
    this.headers = null;
    this.lineNumber = 0;
    this.field = "";
    this.record = [];
    this.inQuotes = false;
    this.pendingQuote = false;
    this.afterQuote = false;
    this.skipLineFeed = false;
    this.decoder = new StringDecoder("utf8");
  }

  _transform(chunk, encoding, callback) {
    try {
      const text = typeof chunk === "string" ? chunk : this.decoder.write(chunk);

      for (const character of text) {
        this._processCharacter(character);
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      for (const character of this.decoder.end()) {
        this._processCharacter(character);
      }

      if (this.pendingQuote) {
        this.pendingQuote = false;
        this.inQuotes = false;
        this.afterQuote = true;
      }

      if (this.inQuotes) {
        throw new Error(`Malformed CSV: unterminated quoted field at row ${this.lineNumber + 1}`);
      }

      if (this.field || this.record.length > 0 || this.afterQuote) {
        this._finishRecord();
      }

      if (!this.headers) {
        throw new Error("Malformed CSV: header row is missing");
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _processCharacter(character) {
    if (this.skipLineFeed) {
      this.skipLineFeed = false;
      if (character === "\n") {
        return;
      }
    }

    if (this.pendingQuote) {
      this.pendingQuote = false;
      if (character === '"') {
        this.field += '"';
        return;
      }

      this.inQuotes = false;
      this.afterQuote = true;
    }

    if (this.inQuotes) {
      if (character === '"') {
        this.pendingQuote = true;
      } else {
        this.field += character;
      }
      return;
    }

    if (this.afterQuote && character !== "," && character !== "\r" && character !== "\n") {
      throw new Error(`Malformed CSV: unexpected character after quote at row ${this.lineNumber + 1}`);
    }

    if (character === '"' && this.field.length === 0 && !this.afterQuote) {
      this.inQuotes = true;
    } else if (character === ",") {
      this._finishField();
    } else if (character === "\r" || character === "\n") {
      this._finishRecord();
      this.skipLineFeed = character === "\r";
    } else if (character === '"') {
      throw new Error(`Malformed CSV: unexpected quote at row ${this.lineNumber + 1}`);
    } else {
      this.field += character;
    }
  }

  _finishField() {
    this.record.push(this.field);
    this.field = "";
    this.afterQuote = false;
  }

  _finishRecord() {
    this._finishField();
    this.lineNumber += 1;

    if (this.record.every((value) => value === "")) {
      this.record = [];
      return;
    }

    if (!this.headers) {
      this.headers = this.record.map((header, index) => {
        const cleaned = header.replace(/^\uFEFF/, "").trim();
        if (!cleaned) {
          throw new Error(`Malformed CSV: empty header at column ${index + 1}`);
        }
        return cleaned;
      });

      if (new Set(this.headers).size !== this.headers.length) {
        throw new Error("Malformed CSV: duplicate column headers");
      }
    } else {
      if (this.record.length !== this.headers.length) {
        throw new Error(
          `Malformed CSV: expected ${this.headers.length} columns but found ${this.record.length} at row ${this.lineNumber}`
        );
      }

      const parsedRecord = {};
      this.headers.forEach((header, index) => {
        parsedRecord[header] = this.record[index];
      });
      this.push(parsedRecord);
    }

    this.record = [];
    this.field = "";
    this.afterQuote = false;
  }
}

/**
 * Data Transformer Stream
 * Applies transformations to each record
 */
class DataTransformer extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
  }

  _transform(record, encoding, callback) {
    try {
      const transformed = { ...record };
      if ("name" in transformed) transformed.name = capitalizeName(transformed.name);
      if ("email" in transformed) transformed.email = normalizeEmail(transformed.email);
      if ("phone" in transformed) transformed.phone = formatPhone(transformed.phone);
      if ("birthdate" in transformed) transformed.birthdate = standardizeDate(transformed.birthdate);
      if ("city" in transformed) transformed.city = capitalizeName(transformed.city);

      this.push(transformed);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * CSV Writer Transform Stream
 * Converts objects back to CSV format
 */
class CSVWriter extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
    this.headerWritten = false;
  }

  _transform(record, encoding, callback) {
    try {
      const headers = Object.keys(record);
      if (!this.headerWritten) {
        this.push(`${headers.map(escapeCSVValue).join(",")}\n`);
        this.headerWritten = true;
      }

      this.push(`${headers.map((header) => escapeCSVValue(record[header])).join(",")}\n`);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * Helper Functions
 */

/**
 * Capitalize names properly
 * @param {string} name - Name to capitalize
 * @returns {string} Capitalized name
 */
function capitalizeName(name) {
  if (typeof name !== "string" || name.length === 0) {
    return "";
  }

  return name
    .toLowerCase()
    .replace(/(^|[\s-])([^\s-])/g, (match, separator, letter) =>
      separator + letter.toUpperCase()
    );
}

/**
 * Normalize email addresses
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email or original if invalid
 */
function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  const normalized = email.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : email;
}

/**
 * Format phone numbers
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone or "INVALID"
 */
function formatPhone(phone) {
  if (typeof phone !== "string") {
    return "INVALID";
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) {
    return "INVALID";
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Standardize date formats
 * @param {string} date - Date to standardize
 * @returns {string} Date in YYYY-MM-DD format
 */
function standardizeDate(date) {
  if (typeof date !== "string") {
    return "";
  }

  let year;
  let month;
  let day;
  let match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (match) {
    [, month, day, year] = match;
  } else {
    match = date.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!match) {
      return date;
    }
    [, year, month, day] = match;
  }

  year = Number(year);
  month = Number(month);
  day = Number(day);

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    return date;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function escapeCSVValue(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Main function to process CSV file
 * @param {string} inputPath - Path to input CSV file
 * @param {string} outputPath - Path to output CSV file
 * @returns {Promise} Promise that resolves when processing is complete
 */
async function processCSVFile(inputPath, outputPath) {
  try {
    await pipeline(
      fs.createReadStream(inputPath),
      new CSVParser(),
      new DataTransformer(),
      new CSVWriter(),
      fs.createWriteStream(outputPath)
    );
  } catch (error) {
    throw new Error(`Failed to process CSV file: ${error.message}`);
  }
}

/**
 * Create sample input data for testing
 */
function createSampleData() {
  const dataDirectory = path.join(process.cwd(), "data");
  const samplePath = path.join(dataDirectory, "users.csv");
  const sampleData = `name,email,phone,birthdate,city
john doe,JOHN.DOE@EXAMPLE.COM,1234567890,12/25/1990,new york
jane smith,Jane.Smith@Gmail.Com,555-123-4567,1985-03-15,los angeles
bob johnson,BOB@TEST.COM,invalid-phone,03/22/1992,chicago
alice brown,alice.brown@company.org,9876543210,1988/07/04,houston
`;

  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(samplePath, sampleData, "utf8");
}

// Export classes and functions
module.exports = {
  CSVParser,
  DataTransformer,
  CSVWriter,
  processCSVFile,
  capitalizeName,
  normalizeEmail,
  formatPhone,
  standardizeDate,
  createSampleData,
};

// Example usage (for testing):
const isReadyToTest = false;

if (isReadyToTest) {
  // Create sample data
  createSampleData();

  // Process the file
  processCSVFile("data/users.csv", "data/users_transformed.csv")
    .then(() => {
      console.log("✅ File transformation completed successfully!");

      // Read and display results
      const output = fs.readFileSync("data/users_transformed.csv", "utf-8");
      console.log("\n📄 Transformed CSV output:");
      console.log(output);
    })
    .catch((error) => {
      console.error("❌ Error processing file:", error.message);
    });
}
