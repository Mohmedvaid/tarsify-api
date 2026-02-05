/**
 * Google Cloud Storage for Notebooks
 * Uses GCS for all environments (local dev + production)
 */
import { Storage } from '@google-cloud/storage';
import { env } from '../config/env';
import { logger } from './logger';

// Initialize GCS client
// In production (Cloud Run), uses default credentials via Workload Identity
// In local dev, uses GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
});

const bucket = storage.bucket(env.GCS_NOTEBOOKS_BUCKET);

logger.info(
  { bucket: env.GCS_NOTEBOOKS_BUCKET },
  'GCS notebook storage initialized'
);

/**
 * Storage service for notebook files
 */
export const notebookStorage = {
  /**
   * Get the GCS path for a notebook
   */
  getFilePath(notebookId: string): string {
    return `notebooks/${notebookId}.ipynb`;
  },

  /**
   * Get the full GCS URI for a notebook
   */
  getGcsUri(notebookId: string): string {
    return `gs://${env.GCS_NOTEBOOKS_BUCKET}/${this.getFilePath(notebookId)}`;
  },

  /**
   * Check if a notebook file exists
   */
  async exists(notebookId: string): Promise<boolean> {
    try {
      const file = bucket.file(this.getFilePath(notebookId));
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to check notebook existence');
      return false;
    }
  },

  /**
   * Save a notebook file to GCS
   * @param notebookId - The notebook ID (used as filename)
   * @param content - The file content as Buffer
   * @returns The GCS URI for storing in DB
   */
  async saveNotebook(notebookId: string, content: Buffer): Promise<string> {
    const filePath = this.getFilePath(notebookId);
    const file = bucket.file(filePath);

    try {
      await file.save(content, {
        contentType: 'application/json',
        metadata: {
          cacheControl: 'no-cache',
        },
      });

      const gcsUri = this.getGcsUri(notebookId);
      logger.info({ notebookId, gcsUri }, 'Notebook file saved to GCS');

      return gcsUri;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to save notebook to GCS');
      throw error;
    }
  },

  /**
   * Read a notebook file from GCS
   * @param notebookId - The notebook ID
   * @returns The file content as Buffer
   */
  async readNotebook(notebookId: string): Promise<Buffer> {
    const file = bucket.file(this.getFilePath(notebookId));

    try {
      const [content] = await file.download();
      return content;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to read notebook from GCS');
      throw error;
    }
  },

  /**
   * Delete a notebook file from GCS
   * @param notebookId - The notebook ID
   */
  async deleteNotebook(notebookId: string): Promise<void> {
    const file = bucket.file(this.getFilePath(notebookId));

    try {
      // Check if file exists first
      const exists = await this.exists(notebookId);
      if (!exists) {
        logger.warn({ notebookId }, 'Notebook file not found in GCS for deletion');
        return;
      }

      await file.delete();
      logger.info({ notebookId }, 'Notebook file deleted from GCS');
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to delete notebook from GCS');
      throw error;
    }
  },

  /**
   * Generate a signed URL for downloading a notebook (time-limited access)
   * @param notebookId - The notebook ID
   * @param expiresInMinutes - How long the URL is valid (default: 15 minutes)
   * @returns Signed URL for direct download
   */
  async getSignedDownloadUrl(
    notebookId: string,
    expiresInMinutes = 15
  ): Promise<string> {
    const file = bucket.file(this.getFilePath(notebookId));

    try {
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to generate signed URL');
      throw error;
    }
  },

  /**
   * Validate notebook file content
   * Basic validation - checks if it's valid JSON and has expected notebook structure
   * @param content - The file content as Buffer
   * @returns Validation result with errors if any
   */
  validateNotebookContent(content: Buffer): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const text = content.toString('utf-8');
      const notebook = JSON.parse(text);

      // Check basic Jupyter notebook structure
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        errors.push('Invalid notebook: missing or invalid "cells" array');
      }

      if (!notebook.metadata || typeof notebook.metadata !== 'object') {
        errors.push('Invalid notebook: missing or invalid "metadata" object');
      }

      if (typeof notebook.nbformat !== 'number') {
        errors.push('Invalid notebook: missing "nbformat" version');
      }

      // Check for at least one code cell
      if (notebook.cells && Array.isArray(notebook.cells)) {
        const hasCodeCell = notebook.cells.some(
          (cell: { cell_type?: string }) => cell.cell_type === 'code'
        );
        if (!hasCodeCell) {
          errors.push('Notebook must contain at least one code cell');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch {
      errors.push('Invalid JSON: file is not a valid JSON document');
      return { valid: false, errors };
    }
  },

  /**
   * Get file size limit in bytes (10MB for MVP)
   */
  getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  },
};

export type NotebookStorage = typeof notebookStorage;
