export async function GET() {
  return Response.json({
    geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'exists' : 'missing',
    allEnv: Object.keys(process.env).filter(k => k.includes('GEMINI'))
  });
}
