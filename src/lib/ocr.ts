import Tesseract from 'tesseract.js';
import { Customer } from './db';

export async function processVisitingCard(imageSource: string | Buffer | File): Promise<Partial<Customer>> {
  try {
    const result = await Tesseract.recognize(imageSource, 'eng');
    const text = result.data.text;
    return extractDataFromText(text);
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to process visiting card.");
  }
}

function extractDataFromText(text: string): Partial<Customer> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const data: Partial<Customer> = {
    name: '',
    company: '',
    designation: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    website: '',
    gst: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    products: '',
    category: '',
    notes: ''
  };

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const websiteRegex = /(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/i;
  const pinRegex = /\b\d{6}\b/;

  let phonesFound: string[] = [];

  for (const line of lines) {
    // Email
    if (!data.email) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) data.email = emailMatch[0];
    }

    // Website
    if (!data.website) {
      const webMatch = line.match(websiteRegex);
      if (webMatch) data.website = webMatch[0];
    }

    // Phones
    const phoneMatches = line.match(phoneRegex);
    if (phoneMatches) {
      phonesFound = [...phonesFound, ...phoneMatches];
    }

    // GST
    if (!data.gst) {
      const gstMatch = line.match(gstRegex);
      if (gstMatch) data.gst = gstMatch[0];
    }

    // Pincode
    if (!data.pincode) {
      const pinMatch = line.match(pinRegex);
      if (pinMatch) data.pincode = pinMatch[0];
    }
  }

  if (phonesFound.length > 0) data.mobile = phonesFound[0].trim();
  if (phonesFound.length > 1) data.alternateMobile = phonesFound[1].trim();

  // Very basic heuristic for name/company
  if (lines.length > 0 && !data.name) {
    // Assume first non-empty line without numbers might be the name or company
    const firstTextLines = lines.filter(l => !/\d/.test(l));
    if (firstTextLines.length > 0) data.name = firstTextLines[0];
    if (firstTextLines.length > 1) data.designation = firstTextLines[1];
    if (firstTextLines.length > 2) data.company = firstTextLines[2];
  }

  return data;
}
