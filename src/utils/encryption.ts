import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
}

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not configured in environment variables');
  }
  
  // Use a KDF (Key Derivation Function) to get a proper key
  return crypto.pbkdf2Sync(
    secret,
    'api-key-encryption-salt', // You can make this configurable too
    100000,
    KEY_LENGTH,
    'sha256'
  );
}

export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine all parts
    const encryptedData: EncryptedData = {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    };
    
    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedString: string): string {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedString);
    const key = getEncryptionKey();
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Simple encryption for development (if you don't want to set up proper key derivation)
export function simpleEncrypt(text: string): string {
  const secret = process.env.ENCRYPTION_SECRET || 'your-default-encryption-secret-change-this';
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function simpleDecrypt(text: string): string {
  const secret = process.env.ENCRYPTION_SECRET || 'your-default-encryption-secret-change-this';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}