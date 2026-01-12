/**
 * Mobile application configuration.
 * Handles environment-specific pointers for the backend API.
 */

// process.env.API_BASE_URL is populated from eas.json during builds
// For local development, it falls back to the local IP address
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
                     process.env.API_BASE_URL || 
                     'http://192.168.86.200:8000';

export default {
  API_BASE_URL,
  IS_PROD: API_BASE_URL.includes('awsapprunner.com'),
};
