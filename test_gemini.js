require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function run() {
  try {
    const res = await openai.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages: [{ role: 'user', content: 'hi' }]
    });
    console.log("SUCCESS:");
    console.log(res.choices[0].message);
  } catch (err) {
    console.log("ERROR STATUS:", err.status);
    console.log("ERROR MSG:", err.message);
  }
}
run();
