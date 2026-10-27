/**
 * NAGARAKSHA — Evidence & File Storage Service
 * 
 * Provides file validation, metadata extraction, and preparation for future
 * cloud object-storage integration (e.g. AWS S3, Cloudflare R2, Google Cloud Storage).
 * 
 * In production:
 * - Files are NEVER stored in the database or client storage.
 * - Client requests a pre-signed PUT URL from the backend with mime/size validation.
 * - Client directly uploads encrypted file to S3/R2 bucket.
 * - Backend receives webhook/confirmation and records the immutable Evidence metadata row.
 */

import { createEvidenceModel, EVIDENCE_STATUS } from './schema.js';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB demo limit

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'video/mp4'
];

/**
 * Validates file constraints before processing
 */
export function validateEvidenceFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5.0 MB.` 
    };
  }

  // Check file type
  const mime = file.type || '';
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mime);
  const hasAllowedExt = /\.(jpe?g|png|webp|svg|mp4)$/i.test(file.name || '');

  if (!isAllowedMime && !hasAllowedExt) {
    return { 
      valid: false, 
      error: 'Unsupported file format. Please upload JPG, PNG, WEBP, or MP4 video.' 
    };
  }

  return { valid: true };
}

/**
 * Converts a File to a displayable preview Data URL (with safety bounds for demo storage)
 */
export function processEvidenceFileForDemo(file, complaintId, uploaderId = 'Citizen') {
  return new Promise((resolve, reject) => {
    const validation = validateEvidenceFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      
      // Calculate simulated SHA-256 checksum based on file size and name
      const simulatedHash = `sha256-${btoa(`${file.name}-${file.size}-${Date.now()}`).substring(0, 32)}`;

      const evidenceRecord = createEvidenceModel({
        complaintId,
        fileName: file.name,
        fileType: file.type || 'image/jpeg',
        fileSizeBytes: file.size,
        url: dataUrl,
        storageDriver: 'demo_browser_storage', // Clearly labeled mock/demo storage
        uploadedBy: uploaderId,
        uploadedAt: new Date().toISOString(),
        verificationStatus: EVIDENCE_STATUS.AI_VERIFIED,
        hashSha256: simulatedHash
      });

      resolve(evidenceRecord);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read evidence file from device.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Interface contract for Future Production Cloud Object Storage (S3 / R2)
 * Demonstrates how this service layer swaps to real cloud storage without changing UI components.
 */
export async function getPresignedUploadUrlContract({ fileName, fileType, complaintId }) {
  // In production, this issues a POST /api/v1/evidence/presigned-url call to backend
  return {
    isMock: true,
    uploadUrl: `https://mock-s3-ap-south-1.amazonaws.com/nagaraksha-evidence/${complaintId}/${encodeURIComponent(fileName)}`,
    fileKey: `evidence/${complaintId}/${fileName}`,
    storageDriver: 's3_standard',
    expiresInSeconds: 300,
    requiredHeaders: {
      'Content-Type': fileType,
      'x-amz-server-side-encryption': 'AES256'
    }
  };
}
