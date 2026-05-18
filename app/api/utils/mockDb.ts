/**
 * ─────────────────────────────────────────────────────────────────────────
 * Shared Mock Database Helper
 * Handles in-memory storage of visa registrations and associated files.
 * Safe for Next.js hot-reloading by attaching to the NodeJS global object.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface DBFile {
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface DBRegistro {
  id: number;
  cod_hash: string;
  files: DBFile[];
  createdAt: string;
  [key: string]: any;
}

const globalForDb = global as unknown as {
  registrosDB: Record<number, DBRegistro>;
  registroCounter: number;
};

// Initialize if not present on global object
if (!globalForDb.registrosDB) {
  globalForDb.registrosDB = {};
}
if (!globalForDb.registroCounter) {
  globalForDb.registroCounter = 1;
}

export const mockDb = {
  /**
   * Get all registrations (for debugging/visualizing)
   */
  getRegistros: (): Record<number, DBRegistro> => {
    return globalForDb.registrosDB;
  },

  /**
   * Get a single registration by numeric ID
   */
  getRegistro: (id: number): DBRegistro | undefined => {
    return globalForDb.registrosDB[id];
  },

  /**
   * Check if a registration exists by numeric ID
   */
  registroExists: (id: number): boolean => {
    return !!globalForDb.registrosDB[id];
  },

  /**
   * Create a new registration record
   */
  crearRegistro: (payload: any): DBRegistro => {
    const id = globalForDb.registroCounter++;
    const codHash =
      payload.cod_hash ||
      payload.sha256 ||
      payload.hash ||
      `VIS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newRegistro: DBRegistro = {
      id,
      cod_hash: codHash,
      files: [],
      ...payload,
      createdAt: new Date().toISOString(),
    };

    globalForDb.registrosDB[id] = newRegistro;
    return newRegistro;
  },

  /**
   * Add uploaded files to an existing registration
   */
  addFilesToRegistro: (
    id: number,
    newFiles: Array<{ name: string; type: string; size: number }>
  ): boolean => {
    const registro = globalForDb.registrosDB[id];
    if (!registro) return false;

    if (!registro.files) {
      registro.files = [];
    }

    // Append new files with timestamps
    const formattedFiles = newFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    registro.files.push(...formattedFiles);
    return true;
  },

  /**
   * Reset the database (useful for testing)
   */
  reset: () => {
    globalForDb.registrosDB = {};
    globalForDb.registroCounter = 1;
  },
};
