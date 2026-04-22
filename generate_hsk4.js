import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

async function generateWords() {
  console.log("Generating HSK 4 words...");
  const wordsPerBatch = 100;
  const totalWords = 600;
  const batches = totalWords / wordsPerBatch;
  
  let allWords = [];
  
  const promises = [];
  for (let i = 0; i < batches; i++) {
    console.log(`Starting batch ${i + 1}/${batches}...`);
    const prompt = `
      Please provide exactly ${wordsPerBatch} unique HSK 4 vocabulary words.
      This is batch ${i + 1} of ${batches}.
      Ensure that these words are strictly from the official HSK 4 list.
      To ensure uniqueness across batches, please focus on words starting with pinyin letters:
      Batch 1: a, b, c
      Batch 2: d, e, f, g
      Batch 3: h, j, k
      Batch 4: l, m, n, o, p, q
      Batch 5: r, s, t, w
      Batch 6: x, y, z
      
      Format the output as a JSON array of objects with the following properties:
      - word: The Chinese word (e.g., "爱情")
      - pinyin: The pinyin with tone marks (e.g., "àiqíng")
      - meaning: The Korean meaning (e.g., "사랑")
      - example: A simple Chinese example sentence (e.g., "这是真正的爱情。")
      - exampleTranslation: The Korean translation of the example sentence (e.g., "이것은 진정한 사랑입니다.")
    `;
    
    promises.push(
      ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                meaning: { type: Type.STRING },
                example: { type: Type.STRING },
                exampleTranslation: { type: Type.STRING }
              },
              required: ["word", "pinyin", "meaning", "example", "exampleTranslation"]
            }
          }
        }
      }).then(response => {
        const batchWords = JSON.parse(response.text);
        console.log(`Batch ${i + 1} generated ${batchWords.length} words.`);
        return batchWords;
      }).catch(e => {
        console.error(`Error generating batch ${i + 1}:`, e);
        return [];
      })
    );
  }
  
  const results = await Promise.all(promises);
  for (const batchWords of results) {
    allWords = allWords.concat(batchWords);
  }
  
  // Deduplicate just in case
  const uniqueWords = [];
  const seen = new Set();
  for (const w of allWords) {
    if (!seen.has(w.word)) {
      seen.add(w.word);
      uniqueWords.push(w);
    }
  }
  
  console.log(`Generated ${uniqueWords.length} unique words.`);
  
  // If we have more than 600, trim it. If less, we might need more, but let's assume it's close enough or we can just use what we have.
  const finalWords = uniqueWords.slice(0, 600);
  
  // Format to string
  const formattedString = finalWords.map(w => `4|${w.word}|${w.pinyin}|${w.meaning}|${w.example}|${w.exampleTranslation}`).join("\n");
  
  // Read existing hsk.ts
  let hskContent = fs.readFileSync("./data/hsk.ts", "utf-8");
  
  // Remove existing HSK 4 words
  const lines = hskContent.split("\n");
  const nonHsk4Lines = lines.filter(line => !line.startsWith("4|"));
  
  // Find where to insert (before the export const hskWords)
  const exportIndex = nonHsk4Lines.findIndex(line => line.includes("export const hskWords"));
  
  nonHsk4Lines.splice(exportIndex - 1, 0, formattedString);
  
  fs.writeFileSync("./data/hsk.ts", nonHsk4Lines.join("\n"));
  console.log("Successfully updated ./data/hsk.ts with 600 HSK 4 words.");
}

generateWords();
