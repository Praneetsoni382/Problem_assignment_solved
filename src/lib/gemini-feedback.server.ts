import { GoogleGenAI } from "@google/genai";

export type ImageScanPart = {
  mimeType: string;
  data: string; // base64 string
};

export type AnalyzeQuestionScansParams = {
  questionNo: number;
  assignmentTitle?: string;
  images: ImageScanPart[];
};

export async function analyzeQuestionScans({
  questionNo,
  assignmentTitle,
  images,
}: AnalyzeQuestionScansParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in Settings/Secrets.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const inlineParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType || "image/jpeg",
      data: img.data,
    },
  }));

  const promptText = `
You are an expert academic evaluator and teacher assistant reviewing student handwritten or scanned answer submissions.
Assignment: ${assignmentTitle ?? "Student Assignment"}
Target Question: Question ${questionNo}

Attached are the scanned page(s) uploaded by the student for Question ${questionNo}.

Please analyze the handwritten / typed answer for Question ${questionNo} and generate concise, constructive, actionable teacher feedback strictly in bullet-point format.

Format Requirements:
- Present 3 to 5 concise bullet points (use standard "• " prefix).
- Include:
  • Working & Steps: Assessment of their methodology, formula, or steps.
  • Accuracy & Logic: Note any computational, conceptual, or missing points (or praise correct reasoning).
  • Constructive Remark: Specific advice or next-step suggestion to improve or maintain quality.
- Keep the tone encouraging, direct, and academic.
- Do NOT include markdown code fences or conversational greetings.
`;

  // Attempt fastest available multimodal model
  const candidateModels = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-pro"];

  let lastError: unknown = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [...inlineParts, { text: promptText }],
      });
      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (modelErr: unknown) {
      console.warn(`Model ${model} failed, trying next candidate...`, modelErr);
      lastError = modelErr;
    }
  }

  console.error("All Gemini candidate models exhausted:", lastError);
  const msg =
    lastError instanceof Error ? lastError.message : "Error analyzing student answer scans";
  throw new Error(`AI Grading Assistant: ${msg}`);
}
