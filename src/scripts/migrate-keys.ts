import dotenv from 'dotenv';
import sequelize from '../config/database';
import ApiKey from '../models/ApiKey';
dotenv.config();


async function migrateExistingKeys() {
  try {
    console.log('🚀 Starting migration of existing API keys...\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established\n');
    
    // Get all API keys
    const allKeys = await ApiKey.findAll();
    
    console.log(`📊 Found ${allKeys.length} API keys in database\n`);
    
    let migratedCount = 0;
    let alreadyEncryptedCount = 0;
    let errorCount = 0;
    
    for (const key of allKeys) {
      const keyValue = key.key;
      const keyId = key.id;
      
      console.log(`\n--- Processing Key: ${keyId} ---`);
      console.log(`Name: ${key.name}`);
      console.log(`Current key preview: ${keyValue.substring(0, 30)}...`);
      console.log(`Length: ${keyValue.length} chars`);
      console.log(`Contains colon: ${keyValue.includes(':')}`);
      
      // Check if key is already encrypted (contains colon)
      if (keyValue.includes(':')) {
        console.log('Already encrypted');
        alreadyEncryptedCount++;
        continue;
      }
      
      // If key starts with sk_ and doesn't have colon, it's plain text
      if (keyValue.startsWith('sk_')) {
        console.log('🔓 Found plain text key, encrypting...');
        
        try {
          // Re-encrypt the key using the model's encrypt method
          const encryptedKey = ApiKey.encryptKey(keyValue);
          
          console.log(`Encrypted preview: ${encryptedKey.substring(0, 30)}...`);
          console.log(`Encrypted length: ${encryptedKey.length} chars`);
          
          // Update the key in database
          await key.update({ key: encryptedKey });
          
          migratedCount++;
          console.log('Successfully encrypted');
        } catch (error: any) {
          errorCount++;
          console.log('Failed to encrypt:', error.message);
        }
      } else {
        console.log('Not a standard API key format, skipping');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total keys found: ${allKeys.length}`);
    console.log(`Already encrypted: ${alreadyEncryptedCount}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(50));
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration successful!');
      console.log('Your API keys are now encrypted in the database.');
    } else {
      console.log('\n📝 No migration needed.');
      console.log('All keys are already encrypted or in correct format.');
    }
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateExistingKeys();