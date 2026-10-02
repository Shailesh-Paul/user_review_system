import api from './api';

export async function getStores(params) {
  const response = await api.get('/user/stores', { params });
  return response.data;
}

export async function getStoreById(storeId) {
  const response = await api.get(`/user/stores/${storeId}`);
  return response.data;
}

export async function getMyRating(storeId) {
  const response = await api.get(`/user/stores/${storeId}/ratings/me`);
  return response.data;
}

export async function submitStoreRating(storeId, payload) {
  const response = await api.post(`/user/stores/${storeId}/ratings`, payload);
  return response.data;
}

export async function updateStoreRating(storeId, payload) {
  const response = await api.patch(`/user/stores/${storeId}/ratings`, payload);
  return response.data;
}

export async function generateAiReviewDraft(storeId, payload) {
  const response = await api.post(`/user/stores/${storeId}/ratings/review/ai`, payload);
  return response.data;
}

export async function uploadStoreMedia(storeId, formData) {
  const response = await api.post(`/user/stores/${storeId}/ratings/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function getStoreRatings(storeId, params) {
  const response = await api.get(`/user/stores/${storeId}/ratings`, { params });
  return response.data;
}
