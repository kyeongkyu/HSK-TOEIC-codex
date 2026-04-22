console.log(JSON.stringify(Object.keys(process.env).filter(k => k.includes("API") || k.includes("GEMINI")), null, 2));
