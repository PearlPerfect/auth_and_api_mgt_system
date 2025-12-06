import User from './User';
import ApiKey from './ApiKey';

// Define associations
ApiKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ApiKey, { foreignKey: 'user_id', as: 'api_keys' });

export { User, ApiKey };