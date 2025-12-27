import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get upload directory from environment or default
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

/**
 * Extract filename from a photo_url path
 * Handles both relative paths (/uploads/file.jpg) and full paths
 * Returns null if it's an external URL or invalid path
 */
export function extractFilename(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return null;
  }

  // If it's an external URL (http:// or https://), don't try to delete it
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return null;
  }

  // Extract filename from path
  // Handles: /uploads/file.jpg, uploads/file.jpg, file.jpg
  let filename = photoUrl;
  
  // Remove leading slash and /uploads/ prefix if present
  if (filename.startsWith('/uploads/')) {
    filename = filename.substring('/uploads/'.length);
  } else if (filename.startsWith('uploads/')) {
    filename = filename.substring('uploads/'.length);
  } else if (filename.startsWith('/')) {
    filename = filename.substring(1);
  }

  // Return just the filename (no path)
  return path.basename(filename);
}

/**
 * Delete an image file from the uploads directory
 * @param {string} photoUrl - The photo_url from the database
 * @returns {Promise<boolean>} - True if file was deleted, false if it didn't exist or was external
 */
export async function deleteImageFile(photoUrl) {
  try {
    const filename = extractFilename(photoUrl);
    
    if (!filename) {
      // External URL or invalid path - nothing to delete
      return false;
    }

    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`Image file not found (may have been already deleted): ${filename}`);
      return false;
    }

    // Delete the file
    fs.unlinkSync(filePath);
    console.log(`Deleted image file: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error deleting image file (${photoUrl}):`, error);
    // Don't throw - we don't want file deletion errors to break the main operation
    return false;
  }
}

/**
 * Delete multiple image files
 * @param {string[]} photoUrls - Array of photo_url values
 * @returns {Promise<number>} - Number of files successfully deleted
 */
export async function deleteImageFiles(photoUrls) {
  if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
    return 0;
  }

  let deletedCount = 0;
  for (const photoUrl of photoUrls) {
    if (photoUrl) {
      const deleted = await deleteImageFile(photoUrl);
      if (deleted) {
        deletedCount++;
      }
    }
  }

  return deletedCount;
}




