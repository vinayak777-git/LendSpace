import { apiClient } from './apiClient';

export interface Review {
  id: string;
  booking_id: string;
  resource_id: string;
  author_id: string;
  author_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface CreateReviewRequest {
  booking_id: string;
  rating: number;
  comment?: string;
}

export const reviewService = {
  async createReview(data: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>('/reviews/', data);
  },

  async getResourceReviews(resourceId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/reviews/resource/${resourceId}`);
  },
};

