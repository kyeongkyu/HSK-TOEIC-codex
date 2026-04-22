const { GoogleGenAI } = require("@google/genai");

async function test() {
  if (!GoogleGenAI) {
      console.error("GoogleGenAI not found in module");
      return;
  }
  const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "dummy");
  console.log("Checking API Key:", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Present" : "Missing");
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Translate 'Hello' to Korean. Reply with just the word.");
    const response = await result.response;
    console.log("Gemini Result:", response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}
test();
