// Configuration for different environments
const config = {
  development: {
    apiBaseUrl: 'http://localhost:10000',
    uploadUrl: 'http://localhost:10000'
  },
  production: {
    apiBaseUrl: 'https://movie-review-api.onrender.com',
    uploadUrl: 'https://movie-review-api.onrender.com'
  }
};

// Get current environment
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const currentConfig = config[environment];

// Export configuration
window.API_CONFIG = currentConfig;
