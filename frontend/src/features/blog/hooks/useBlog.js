import { useQuery } from '@tanstack/react-query'
import { blogApi } from '../services/blogApi'

export const useBlogPosts = (filters = {}) => {
  return useQuery({
    queryKey: ['blog-posts', filters],
    queryFn: () => blogApi.getPosts(filters),
  })
}

export const useBlogPost = (slug) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getPost(slug),
    enabled: !!slug,
  })
}

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: blogApi.getCategories,
  })
}