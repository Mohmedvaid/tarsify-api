/**
 * Local File Storage
 * Simple local file storage for MVP. Will be replaced with blob storage later.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from './logger';
import { config } from '@/config';

// Storage directory for notebooks
const NOTEBOOKS_DIR = path.join(process.cwd(), 'uploads', 'notebooks');

// Ensure upload directory exists
if (!existsSync(NOTEBOOKS_DIR)) {
  mkdirSync(NOTEBOOKS_DIR, { recursive: true });
  logger.info({ dir: NOTEBOOKS_DIR }, 'Created notebooks upload directory');
}

/**
 * Storage service for notebook files
 */
export const notebookStorage = {
  /**
   * Get the file path for a notebook
   */
  getFilePath(notebookId: string): string {
    return path.join(NOTEBOOKS_DIR, `${notebookId}.ipynb`);
  },

  /**
   * Check if a notebook file exists
   */
  async exists(notebookId: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(notebookId);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Save a notebook file
   * @param notebookId - The notebook ID (used as filename)
   * @param content - The file content as Buffer
   * @returns The relative file path (for storing in DB)
   */
  async saveNotebook(notebookId: string, content: Buffer): Promise<string> {
    const filePath = this.getFilePath(notebookId);
    
    try {
      await fs.writeFile(filePath, content);
      logger.info({ notebookId, filePath }, 'Notebook file saved');
      
      // Return relative path for DB storage
      return `/uploads/notebooks/${notebookId}.ipynb`;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to save notebook file');
      throw error;
    }
  },

  /**
   * Read a notebook file
   * @param notebookId - The notebook ID
   * @returns The file content as Buffer
   */
  async readNotebook(notebookId: string): Promise<Buffer> {
    const filePath = this.getFilePath(notebookId);
    
    try {
      const content = await fs.readFile(filePath);
      return content;
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to read notebook file');
      throw error;
    }
  },

  /**
   * Delete a notebook file
   * @param notebookId - The notebook ID
   */
  async deleteNotebook(notebookId: string): Promise<void> {
    const filePath = this.getFilePath(notebookId);
    
    try {
      // Check if file exists first
      const exists = await this.exists(notebookId);
      if (!exists) {
        logger.warn({ notebookId }, 'Notebook file not found for deletion');
        return;
      }
      
      await fs.unlink(filePath);
      logger.info({ notebookId, filePath }, 'Notebook file deleted');
    } catch (error) {
      logger.error({ error, notebookId }, 'Failed to delete notebook file');
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
