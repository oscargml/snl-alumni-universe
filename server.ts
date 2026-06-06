import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for lazy Gemini initialization with error handling
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or uses placeholder value. Please configure it in your Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST Api Endpoints FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Endpoint 1: Ask the AI Comedy Historian for deep relationships, trivia & facts
app.post("/api/comedy-historian", async (req, res) => {
  try {
    const { nodeName, nodeType, query, currentConnections } = req.body;
    
    if (!nodeName) {
      res.status(400).json({ error: "Missing nodeName parameter." });
      return;
    }

    const ai = getGeminiClient();
    
    const prompt = `
      You are the ultimate SNL (Saturday Night Live) and comedy history expert, known as the Comedy Historian AI.
      The user is exploring an interactive graph visualization called the "SNL Alumni Universe" and clicked on a node named "${nodeName}" (Type: ${nodeType}).
      
      We want to provide deep, fascinating, and accurate historical insights about this subject.
      The current primary database connections we show are: ${JSON.stringify(currentConnections || [])}.
      
      ${query ? `The user has a specific question: "${query}"` : `Please discover obscure collaborations, unlisted connections (e.g. movies they co-starred in, background writers' room connections, cameos, or real-life friendships), iconic behind-the-scenes trivia, and their lasting comedy legacy.`}

      Guidelines:
      1. Be highly factual and accurate. Do not make up fake movies or connections.
      2. Write in an entertaining, witty, and engaging voice.
      3. Focus heavily on expanding connections and showing how "${nodeName}" ties into other comedy figures (like Lorne Michaels, other eras of cast, or specific writers).
      4. Format your response cleanly using Markdown. Use bold headers, bullet lists, and highlight key names or show references.
      5. Keep it concise, punchy, and highly informative (approx. 200-250 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the world's absolute authority on Saturday Night Live, late-night comedy, Broadway Video, and the general comedy movie/TV ecosystem.",
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Error in /api/comedy-historian:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI integration." });
  }
});

// Endpoint 2: Infinite Dynamic SNL Trivia Generation
app.post("/api/generate-trivia", async (req, res) => {
  try {
    const { answeredIds, category } = req.body;
    const ai = getGeminiClient();

    const prompt = `
      Generate a brand-new, challenging, and highly entertaining Saturday Night Live (SNL) trivia question.
      
      Focus category: ${category || 'any SNL era/collaboration'}.
      These are questions the user might have seen or we want to avoid: ${JSON.stringify(answeredIds || [])}.
      
      The question should be about relationships, casting history, obscure character origins, famous writers-turned-cast, or collaborations between alumni (e.g., in movies like Caddyshack, Ghostbusters, Anchorman, or Mean Girls).
      
      You MUST respond with a JSON object matching this exact schema:
      {
        "prompt": "The question prompt text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "The EXACT matching correct string from the options array"
      }
      
      Make sure only ONE option is correct. The correct option must match the "answer" field EXACTLY.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the ultimate comedy game-show master. Return only JSON that validates against the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: "The trivia question body.",
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Four distinct options. Exactly one must be correct.",
            },
            answer: {
              type: Type.STRING,
              description: "The correct option. Must match one of the items in the options array exactly.",
            }
          },
          required: ["prompt", "options", "answer"]
        }
      }
    });

    const resultText = response.text ? response.text.trim() : "";
    const triviaData = JSON.parse(resultText);
    res.json(triviaData);
  } catch (error: any) {
    console.error("Error in /api/generate-trivia:", error);
    res.status(500).json({ error: error.message || "Could not generate a new trivia question." });
  }
});

// Vite & Static file hosting middleware wrapper
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite developer server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from production build /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SNL Alumni Universe Backend running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
