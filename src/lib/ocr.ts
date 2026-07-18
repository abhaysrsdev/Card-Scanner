import { Customer } from './db';

export async function processVisitingCard(imageSource: string): Promise<Partial<Customer>> {
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageSource }),
    });

    if (!response.ok) {
      let errorMsg = "Failed to process image via API.";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        if (response.status === 413) errorMsg = "Image is too large. Please upload a smaller image.";
        else if (response.status === 429) errorMsg = "Too many scans! Please wait a minute before scanning again (Rate Limit).";
        else if (response.status === 504) errorMsg = "The AI took too long to respond. Please try again.";
        else errorMsg = `Server Error (${response.status})`;
      }
      throw new Error(errorMsg);
    }

    const data: Partial<Customer> = await response.json();
    return data;
  } catch (error: any) {
    console.error("OCR API Error:", error);
    throw new Error(error.message || "Failed to process visiting card with Gemini.");
  }
}
