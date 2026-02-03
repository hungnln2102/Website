import CryptoJS from 'crypto-js';

// SECURITY: Encryption key must be set in environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY must be set in environment variables. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

/**
 * Encryption service for sensitive data
 * Uses AES-256 encryption
 */
export class EncryptionService {
  /**
   * Encrypt sensitive data
   * @param data Plain text data
   * @returns Encrypted string
   */
  encrypt(data: string): string {
    if (!data) return '';
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt encrypted data
   * @param encryptedData Encrypted string
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * One-way hash (cannot be decrypted)
   * Use for data that needs to be compared but not retrieved
   * @param data Data to hash
   * @returns SHA-256 hash
   */
  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate random token
   * @param length Token length (default: 32)
   * @returns Random hex string
   */
  generateToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Encrypt object (converts to JSON first)
   * @param obj Object to encrypt
   * @returns Encrypted string
   */
  encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt to object
   * @param encryptedData Encrypted string
   * @returns Decrypted object
   */
  decryptObject<T = any>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
