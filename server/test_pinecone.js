require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function run() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_INDEX);
  const vectors = [{
    id: "test-vec-1",
    values: new Array(1536).fill(0.1),
    metadata: { text: "test" }
  }];
  try {
    await index.upsert(vectors);
    console.log("Upsert array successful");
  } catch (e) {
    console.log("Upsert array failed:", e.message);
  }
}
run();
