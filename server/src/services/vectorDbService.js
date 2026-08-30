const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeClient = null;
let pineconeIndex = null;

const isPineconeConfigured = process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX;

if (isPineconeConfigured) {
  try {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX);
    console.log('Pinecone Vector Database Configured.');
  } catch (err) {
    console.error('Pinecone initialization error:', err);
  }
} else {
  console.warn('Pinecone keys not set. Vector search will run via local Mongoose-level cosine-similarity checks.');
}

/**
 * Upload document chunks to Pinecone
 */
const upsertVectors = async (documentId, chunks, user) => {
  if (pineconeIndex && chunks && chunks.length > 0) {
    try {
      console.log(`Synchronizing ${chunks.length} vectors to Pinecone index: ${process.env.PINECONE_INDEX}`);
      const vectors = chunks.map((chunk, index) => {
        return {
          id: `${documentId}-chunk-${index}`,
          values: chunk.embedding,
          metadata: {
            documentId: documentId.toString(),
            userId: user ? user._id.toString() : 'system',
            text: chunk.text,
            chunkIndex: index
          }
        };
      });
      
      // Batch upsert if there are many vectors
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await pineconeIndex.upsert(batch);
      }
      return true;
    } catch (error) {
      console.error('Pinecone sync failed, using MongoDB backup: ', error);
    }
  }
  return true;
};

/**
 * Delete vectors from Pinecone
 */
const deleteVectors = async (documentId) => {
  if (pineconeIndex) {
    try {
      console.log(`Deleting vectors for Document: ${documentId} from Pinecone.`);
      // Try deleting by metadata filter (supported by serverless indexes)
      // We wrap it in try/catch in case the index type does not support it
      try {
        let deleted = false;
        // The pinecone client v3 allows deleting with a filter directly if it's a serverless index
        if (pineconeIndex.deleteMany) {
           await pineconeIndex.deleteMany({ documentId: documentId.toString() });
           deleted = true;
        }
        if (!deleted) {
           console.warn('deleteMany by metadata filter may not be supported by this index tier. Vectors may orphan.');
        }
      } catch (err) {
        console.error('Failed deleting by metadata:', err.message);
      }
      return true;
    } catch (error) {
      console.error('Pinecone delete failed:', error);
    }
  }
  return true;
};

/**
 * Query Pinecone for top matching chunks
 */
const queryVectors = async (queryEmbedding, userId, topK = 5) => {
  if (pineconeIndex && queryEmbedding) {
    try {
      const queryParams = {
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true
      };
      
      // If a userId is provided and the user is not admin, we could filter by userId.
      if (userId) {
        queryParams.filter = { userId: userId.toString() };
      }
      
      const queryResponse = await pineconeIndex.query(queryParams);
      return queryResponse.matches || [];
    } catch (error) {
      console.error('Pinecone query failed: ', error);
      return [];
    }
  }
  return [];
};

module.exports = {
  upsertVectors,
  deleteVectors,
  queryVectors,
  isPineconeConfigured
};
