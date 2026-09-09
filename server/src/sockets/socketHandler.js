//1. Map to store connected users and their sockets: userId -> Set of socketIds.  userId "123" -> [SocketA, SocketB]
const userSockets = new Map();

// Save IO reference
let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io; // Jab bhi koi frontend client Socket.IO ke through connect hoga, connection event trigger hoga.

  io.on('connection', (socket) => { //Socket A <-> Server : Connected
    console.log(`Socket connected: ${socket.id}`); //Socket A connected

    //2. Register user session
    socket.on('register', (userId) => {//register event: Jaise hi frontend load hota hai, wo ek secret signal (register) bhejta hai
      if (userId) {//
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set()); // duplicate socket ID automatically avoid ho sakti hai.
        }
        userSockets.get(userId).add(socket.id);
        socket.userId = userId;
        console.log(`User ${userId} registered to socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => { // disconnect event: Jab user browser tab band kar deta hai ya net chala jata hai, toh server automatically us socket.id ko Map se delete kar deta ha
      console.log(`Socket disconnected: ${socket.id}`); //Socket A disconnect
      if (socket.userId && userSockets.has(socket.userId)) {
        const sockets = userSockets.get(socket.userId);
        sockets.delete(socket.id); // user123 → { SocketA, SocketB } → user123 → { SocketB } (socketA delete)
        if (sockets.size === 0) {
          userSockets.delete(socket.userId); // user123 → {} (Map se delete ho gaya).
        }
      }
    });
  });
};

/**
 * Emit a document processing status change to the specific user
 * @param {string} userId - ID of the user who owns the document
 * @param {Object} documentData - The updated document object/info
 */
// The Broadcast Engine (emitDocStatus)
const emitDocStatus = (userId, documentData) => {
  if (!ioInstance) return;

  const userStringId = userId.toString();
  if (userSockets.has(userStringId)) { //userSockets -->  Kaunsa user kis active socket connection se connected ha
    const socketIds = userSockets.get(userStringId); // { socketA, socketB } => Real-time Updates
    socketIds.forEach((socketId) => { // SocketA ko real-time update bhejo -> Is user ke har active socket par document_status_update
      ioInstance.to(socketId).emit('document_status_update', {//Is particular connected client ko real-time event bhejo.
        documentId: documentData._id,
        status: documentData.status,
        title: documentData.title,
        ocrConfidence: documentData.ocrConfidence, //Ye guarantee nahi karta ki exactly 95% characters objectively correct hain.
        category: documentData.category,
        tags: documentData.tags,
        updatedAt: documentData.updatedAt,
        errorMessage: documentData.errorMessage
      });
    });
  }
};

module.exports = {
  initSocket,
  emitDocStatus
};
