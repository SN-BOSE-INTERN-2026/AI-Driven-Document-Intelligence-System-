const cloudinary = require('cloudinary').v2;

/**
 * Configure and export Cloudinary SDK.
 * Returns null if environment variables are missing (local-storage fallback).
 */

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️  Cloudinary configured successfully');
} else {
  console.log('📁 Cloudinary not configured — using local file storage');
}

module.exports = { cloudinary, isCloudinaryConfigured };
