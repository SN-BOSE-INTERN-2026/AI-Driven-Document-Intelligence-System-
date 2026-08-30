const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const Query = require('../models/Query');
const AuditLog = require('../models/AuditLog');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const vectorDbService = require('../services/vectorDbService');
const { emitDocStatus } = require('../sockets/socketHandler');
const { cloudinary, isCloudinaryConfigured } = require('../configs/cloudinary');


 // Returns { url, key }.
 // files store karta hai: ya toh Cloudinary ya local disk
const uploadFileToStorage = async (file) => {
  if (isCloudinaryConfigured) {
    const ext = path.extname(file.originalname || file.path).toLowerCase();
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const resourceType = imageExts.includes(ext) ? 'image' : 'raw';
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // Try 1: Unsigned upload if preset is explicitly provided
    if (preset) { // Preset = ready-made settings ka packet,my_preset use karo.,preset = Cloudinary me saved upload settings ka naam
      try {
        const result = await cloudinary.uploader.unsigned_upload(file.path, preset, {
          resource_type: resourceType,
          folder: 'ai-doc-intel'
        });
        console.log('☁️  File uploaded to Cloudinary (Unsigned Preset):', result.secure_url);
        return {
          url: result.secure_url,
          key: result.public_id
        };
      } catch (presetErr) {
        console.warn('Unsigned preset upload attempt:', presetErr.message);
      }
    }

    // Try 2: Signed upload
    try {
      const uploadOptions = {  // Cloudinary ke liye options prepare kiye ja rahe hain.
        resource_type: resourceType, // raw (PDF/text) ya image.
        folder: 'ai-doc-intel',
        use_filename: true,
        unique_filename: true
      };
      if (preset) uploadOptions.upload_preset = preset;

      const result = await cloudinary.uploader.upload(file.path, uploadOptions); //Ab Cloudinary par upload ho raha hai
      console.log('☁️  File uploaded to Cloudinary:', result.secure_url);
      return {
        url: result.secure_url,
        key: result.public_id                                               // Cloudinary me file ki identification.
      };
    } catch (cloudErr) {
      // Try 3: Fallback using default ml_default preset if 403 forbidden
      if (cloudErr.http_code === 403 || cloudErr.message?.includes('403')) {
        try {
          const result = await cloudinary.uploader.unsigned_upload(file.path, 'ml_default', {
            resource_type: resourceType,
            folder: 'ai-doc-intel'
          });
          console.log('☁️  File uploaded to Cloudinary (Fallback Unsigned):', result.secure_url);
          return {
            url: result.secure_url,
            key: result.public_id
          };
        } catch (fallbackErr) {
          // Both failed
        }
      }

      console.error('Cloudinary upload error:', cloudErr.message || cloudErr);
      throw new Error(`Cloudinary upload failed: ${cloudErr.message}`);
    }
  }

  // Local storage fallback (relative web path)
  const relativePath = `/uploads/${path.basename(file.path)}`;
  return {
    url: relativePath,
    key: path.basename(file.path)
  };
};




// fileKey jab Cloudinary se aaye toh usse delete karna,nahi toh local file delete karna
const deleteFileFromStorage = async (fileKey) => {
  if (isCloudinaryConfigured && fileKey) {
    try {
      // Try deleting as raw first (PDF, DOCX, TXT), then as image
      await cloudinary.uploader.destroy(fileKey, { resource_type: 'raw' });
    } catch {
      try {
        await cloudinary.uploader.destroy(fileKey, { resource_type: 'image' });
      } catch (err) {
        console.log('Cloudinary file deletion failed:', err.message);
      }
    }
  } else if (fileKey) {
    // Local storage: delete from uploads directory
    const filePath = path.join(__dirname, '../../uploads', fileKey);
    await fs.unlink(filePath).catch(err =>
      console.log('Local file deletion skipped or failed:', err.message)
    );
  }
};


// Background worker task to process document: OCR -> Chunk -> Embed -> Summarize -> Classify -> Complete

const processDocumentBackground = async (documentId, tempFilePath, originalName, userId) => {
  let doc = await Document.findById(documentId);
  if (!doc) return;

  try {
    // 1. OCR / Text Extraction
    doc.status = 'ocr_processing';
    await doc.save();
    emitDocStatus(userId, doc);// Socket.io ke through frontend ko real-time status bhej raha hai

    const { text, confidence } = await ocrService.extractText(tempFilePath, originalName); // Yahan ocrService document se text extract karta hai.

    doc.extractedText = text;
    doc.ocrConfidence = confidence;//OCR ki accuracy
    doc.status = 'chunking';
    await doc.save();
    emitDocStatus(userId, doc);

    // 2. Chunking
    const textChunks = aiService.chunkText(text, 1000, 200);

    // 3. Classification & Tags
    doc.status = 'indexing'; // Summarizing & Embedding
    await doc.save();
    emitDocStatus(userId, doc);

    const classification = await aiService.classifyDocument(text);
    doc.category = classification.category;
    doc.tags = classification.tags;

    // 4. Summarization
    const summaries = await aiService.generateSummary(text);
    doc.summary = summaries;

    // 5. Generate Vector Embeddings for Chunks
    const chunksWithVectors = [];
    for (let idx = 0; idx < textChunks.length; idx++) {
      const chunkText = textChunks[idx];
      const embedding = await aiService.generateEmbedding(chunkText);
      chunksWithVectors.push({
        text: chunkText,
        embedding: embedding,
        index: idx
      });
    }

    
    doc.status = 'completed';
    await doc.save();
    emitDocStatus(userId, doc);

    // Sync to external vector database (if Pinecone is set up)
    await vectorDbService.upsertVectors(doc._id, chunksWithVectors, userId);

    // Clean up local temp file after OCR is done (Cloudinary already has the permanent copy)
    if (isCloudinaryConfigured) {
      await fs.unlink(tempFilePath).catch(() => { });
    }

    await AuditLog.create({
      action: 'DOCUMENT_PROCESSED',
      performedBy: userId,
      details: `Document "${doc.title}" processed successfully. Chunks: ${textChunks.length}, Category: ${doc.category}`,
      ipAddress: 'System'
    });

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    doc.status = 'failed';
    doc.errorMessage = error.message;
    await doc.save();
    emitDocStatus(userId, doc);

    // Clean up local temp file on error ONLY if it's not stored locally as the primary file
    // For local storage mode, we keep the raw file so the user can still download it even if AI processing failed
    // await fs.unlink(tempFilePath).catch(() => {});

    await AuditLog.create({
      action: 'DOCUMENT_PROCESS_FAILED',
      performedBy: userId,
      details: `Document "${doc.title}" processing failed: ${error.message}`,
      ipAddress: 'System'
    });
  }
};


// Upload document (HTTP route handler)
exports.uploadDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  const { title, description } = req.body;

  try {
    // Determine storage location
    const storageResult = await uploadFileToStorage(req.file);

    // Save initial document record in database
    const doc = await Document.create({
      title: title || req.file.originalname,
      description: description || '',
      fileUrl: storageResult.url,
      fileKey: storageResult.key,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      status: 'uploading'
    });

    await AuditLog.create({
      action: 'DOCUMENT_UPLOADED',
      performedBy: req.user._id,
      details: `Uploaded file: ${req.file.originalname}. Title: ${doc.title}. Status: Processing started.`,
      ipAddress: req.ip
    });

    // Start background processing pipeline (doesn't block response)
    const tempFilePath = req.file.path; // will be deleted in worker if Cloudinary is active
    processDocumentBackground(doc._id, tempFilePath, req.file.originalname, req.user._id);

    res.status(202).json({
      success: true,
      message: 'Document upload success. Processing started in the background.',
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

// Fetch all documents for user
exports.getDocuments = async (req, res, next) => {
  try {
    let query = {};

    // Non-admins only get their own documents
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user._id;
    }

    // Filters
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const docs = await Document.find(query)
      .select('-chunks -extractedText') // Exclude heavy fields for list queries
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName email');

    res.status(200).json({
      success: true,
      count: docs.length,
      documents: docs
    });
  } catch (error) {
    next(error);
  }
};

// Fetch single document
exports.getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('uploadedBy', 'fullName email');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Auth verification
    if (req.user.role !== 'admin' && doc.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this document' });
    }

    res.status(200).json({
      success: true,
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

// Update document details
exports.updateDocument = async (req, res, next) => {
  const { title, description, category, tags } = req.body;

  try {
    let doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this document' });
    }

    doc.title = title || doc.title;
    doc.description = description !== undefined ? description : doc.description;
    doc.category = category || doc.category;
    if (tags) {
      doc.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

// Delete document
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && (!doc.uploadedBy || doc.uploadedBy.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    // Delete vectors
    await vectorDbService.deleteVectors(doc._id);

    // Delete stored file (Cloudinary or local)
    await deleteFileFromStorage(doc.fileKey);

    await Document.deleteOne({ _id: doc._id });

    await AuditLog.create({
      action: 'DOCUMENT_DELETED',
      performedBy: req.user._id,
      details: `Deleted document "${doc.title}"`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Summarize document
exports.summarizeDocument = async (req, res, next) => {
  const documentId = req.body.documentId; // changed from req.params.id

  try {
    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (doc.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Document is not processed yet' });
    }

    // Return the stored summary
    res.status(200).json({
      success: true,
      summary: doc.summary
    });
  } catch (error) {
    next(error);
  }
};

// RAG Q&A Route
exports.questionAnswer = async (req, res, next) => {
  const { documentId, question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, message: 'Please provide a question' });
  }

  try {
    let chunksToSearch = [];
    let docRef = null;

    if (documentId) {
      const doc = await Document.findById(documentId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to query this document' });
      }
      if (doc.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Document processing is not completed' });
      }
      docRef = doc._id;
    }

    if (!vectorDbService.isPineconeConfigured) {
      return res.status(500).json({ success: false, message: 'Pinecone is required but not configured for chunk storage.' });
    }

    // Always use Pinecone for querying now
    const queryEmbedding = await aiService.generateEmbedding(question);
    
    // We can query Pinecone globally or filtered by documentId
    // Currently vectorDbService.queryVectors supports filtering by userId. 
    // To filter by documentId, we could update the service, but since we didn't yet,
    // we'll fetch matches and filter manually if a specific documentId was provided.
    // (Or better, vectorDbService allows metadata filtering if we update it).
    const pineconeMatches = await vectorDbService.queryVectors(
      queryEmbedding,
      req.user.role !== 'admin' ? req.user._id : null,
      20 // get more matches so we can filter locally by docId if needed
    );

    // Filter to the specific document if requested
    let finalMatches = pineconeMatches;
    if (documentId) {
      finalMatches = finalMatches.filter(m => m.metadata.documentId === documentId.toString());
    }

    // Map Pinecone matches to chunks format expected by aiService
    chunksToSearch = finalMatches.map(m => ({
      text: m.metadata.text,
      index: m.metadata.chunkIndex,
      embedding: m.values
    }));

    const qaResult = await aiService.answerQuestion(question, chunksToSearch);

    // Save Q&A to database history
    const query = await Query.create({
      user: req.user._id,
      document: docRef,
      question,
      answer: qaResult.answer,
      sources: qaResult.sources
    });

    res.status(200).json({
      success: true,
      query
    });
  } catch (error) {
    next(error);
  }
};

// Semantic Search across documents
exports.searchDocuments = async (req, res, next) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Please provide a search query' });
  }

  try {
    if (!vectorDbService.isPineconeConfigured) {
      return res.status(500).json({ success: false, message: 'Pinecone is required for semantic search.' });
    }

    const queryEmbedding = await aiService.generateEmbedding(query);
    const pineconeMatches = await vectorDbService.queryVectors(
      queryEmbedding,
      req.user.role !== 'admin' ? req.user._id : null,
      15
    );

    const scoredDocs = [];
    const seenDocIds = new Set();

    // Map Pinecone matches back to MongoDB documents
    for (const match of pineconeMatches) {
      if (match.score < 0.05) continue; // skip low confidence
      const matchDocId = match.metadata.documentId;
      
      // Only include each document once (the highest matching chunk comes first)
      if (!seenDocIds.has(matchDocId)) {
        seenDocIds.add(matchDocId);
        
        // Fetch document metadata from Mongo
        const doc = await Document.findById(matchDocId).select('title category tags fileUrl fileType fileSize createdAt uploadedBy status');
        if (doc && doc.status === 'completed') {
          // Double check permissions just in case
          if (req.user.role === 'admin' || doc.uploadedBy.toString() === req.user._id.toString()) {
            scoredDocs.push({
              document: doc,
              relevanceScore: parseFloat((match.score * 100).toFixed(2)),
              snippet: match.metadata.text.substring(0, 250) + '...'
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      results: scoredDocs.slice(0, 10) // top 10 matches
    });
  } catch (error) {
    next(error);
  }
};
