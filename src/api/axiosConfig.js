import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const instance = axios.create({
  // Use the environment variable for production, fallback to localhost for development
  baseURL: '/',
  withCredentials: true
});

export default instance;