// src/features/blog/services/blogApi.js
import api from '@lib/axios';
import { buildQueryString } from '@lib/utils';

export const blogApi = {
  getPosts: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/api/blog/posts/${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },
  getPost: async (slug) => {
    const response = await api.get(`/api/blog/posts/${slug}/`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/api/blog/categories/');
    return response.data;
  },
  getFeatured: async () => {
    const response = await api.get('/api/blog/posts/featured/');
    return response.data;
  },
  getPopular: async () => {
    const response = await api.get('/api/blog/posts/popular/');
    return response.data;
  },
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/api/blog/upload-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};