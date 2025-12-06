// src/scripts/sync-db.ts
import sequelize from '../config/database';
import './../models/User';
import './../models/ApiKey';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();