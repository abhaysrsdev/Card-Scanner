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
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process image via API.");
    }

    const data: Partial<Customer> = await response.json();
    return data;
  } catch (error) {
    console.error("OCR API Error:", error);
    throw new Error("Failed to process visiting card with Gemini.");
  }
}
