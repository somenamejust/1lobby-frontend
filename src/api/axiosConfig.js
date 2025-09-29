import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const instance = axios.create({
  // Use the environment variable for production, fallback to localhost for development
  baseURL: 'http://164.92.250.91:5000',
  withCredentials: true
});

export default instance;