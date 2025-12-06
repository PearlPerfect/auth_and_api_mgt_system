import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const dbName = process.env.DB_NAME || 'auth_system_db';
const dbUser = process.env.DB_USER || 'auth_user';
const dbPassword = process.env.DB_PASSWORD || 'password';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection has been established successfully.');
  })
  .catch((error: Error) => {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log('⚠️  Starting server without database connection...');
  });

export default sequelize;