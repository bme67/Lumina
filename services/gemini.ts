import { GoogleGenAI } from "@google/genai";

// Initialize Gemini only if API key is present
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateCleanTitle = async (filename: string): Promise<string> => {
  if (!ai) {
    // Fallback if no API key
    return filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Convert this filename into a clean, professional video title. 
    Remove extensions, replace underscores/hyphens with spaces, use Title Case, and remove any weird codes or dates if they look like auto-generated garbage. 
    Return ONLY the clean title string.
    
    Filename: "${filename}"`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    return filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  }
};
