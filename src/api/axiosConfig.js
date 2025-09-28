import axios from 'axios';

console.log("Building with API URL:", process.env.REACT_APP_API_URL);

// Создаем экземпляр axios с базовой конфигурацией
const instance = axios.create({
  // Use the environment variable for production, fallback to localhost for development
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true
});

export default instance;