require('dotenv').config({ path: '../.env' });
const { Pinecone } = require('@pinecone-database/pinecone');

async function run() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_INDEX);
  
  try {
    await index.deleteMany({ filter: { documentId: "test" } });
    console.log("Delete (filter wrapper) SUCCESS");
  } catch (e) {
    console.log("Delete (filter wrapper) FAILED:", e.message);
  }
}
run();
