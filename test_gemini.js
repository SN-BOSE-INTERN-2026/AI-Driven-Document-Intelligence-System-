require('dotenv').config();

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

async function run() {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'hi' }] }]
        })
      }
    );
    const data = await res.json();
    if (data.candidates && data.candidates.length > 0) {
      console.log("SUCCESS:", data.candidates[0].content.parts[0].text);
    } else {
      console.log("UNEXPECTED RESPONSE:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
run();
