import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30; 

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    if (!process.env.GEMINI_API_KEY) {
       console.error("GEMINI_API_KEY is not set.");
       return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are a highly accurate visiting card data extractor. Extract the following fields from the image and return ONLY a valid JSON object with exactly these keys (if a field is missing, leave it as an empty string):
{
  "name": "",
  "company": "",
  "designation": "",
  "mobile": "",
  "alternateMobile": "",
  "whatsapp": "",
  "email": "",
  "website": "",
  "gst": "",
  "address": "",
  "city": "",
  "state": "",
  "country": "",
  "pincode": "",
  "products": "",
  "category": "",
  "notes": ""
}
Do not add any markdown formatting like \`\`\`json. Just return the raw JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]
    });

    let text = response.text || "{}";
    
    // Clean up potential markdown formatting from the response
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return NextResponse.json({ error: "Failed to process image with Gemini." }, { status: 500 });
  }
}
