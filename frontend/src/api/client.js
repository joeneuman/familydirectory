import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

const client = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;


