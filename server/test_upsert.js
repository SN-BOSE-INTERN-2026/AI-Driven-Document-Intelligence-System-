require('dotenv').config({ path: '../.env' });
const { Pinecone } = require('@pinecone-database/pinecone');

async function run() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_INDEX);
  
  const batch = [{
    id: "test-vec-1",
    values: new Array(1536).fill(0.1),
    metadata: { text: "test" }
  }];

  try {
    await index.upsert(batch); // Try array
    console.log("Upsert (array) SUCCESS");
  } catch (e) {
    console.log("Upsert (array) FAILED:", e.message);
  }

  try {
    await index.upsert({ records: batch }); // Try object
    console.log("Upsert (object) SUCCESS");
  } catch (e) {
    console.log("Upsert (object) FAILED:", e.message);
  }
}
run();
