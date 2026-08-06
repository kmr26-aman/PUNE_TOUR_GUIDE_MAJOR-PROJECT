const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  let url = envUrl;
  
  if (!url) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      url = 'https://pune-tour-guide-major-project.vercel.app/api';
    } else {
      url = 'http://localhost:3001/api';
    }
  }
  
  url = url.trim().replace(/[\.\s]+$/, '').replace(/\/+$/, '');
  
  // Force HTTPS if hosted page is HTTPS to prevent Mixed Content browser blocks
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }

  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

export const API_BASE_URL = resolveApiBaseUrl();

// Client-side in-memory cache
const apiCache = new Map();
const CACHE_TTL_MS = 45 * 1000;

const getCached = (key) => {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  apiCache.set(key, { timestamp: Date.now(), data });
};

export const clearApiCache = (prefix = '') => {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  }
};

const getHeaders = (extraHeaders = {}) => {
  const authKey = localStorage.getItem('pune_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (authKey) {
    headers['Authorization'] = 'Bearer ' + authKey;
  }
  return headers;
};

const parseErrorResponse = async (response, fallbackMessage) => {
  let errorMsg = fallbackMessage;
  try {
    const errorData = await response.json();
    errorMsg = errorData.error || errorData.message || fallbackMessage;
  } catch {
    errorMsg = `${fallbackMessage} (${response.status}: ${response.statusText || 'Server Error'})`;
  }
  return new Error(errorMsg);
};

export const loginUser = async (email, password) => {
  clearApiCache();
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, 'Login failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('pune_auth_token', data.token);
      if (data.user?.name) localStorage.setItem('pune_user_name', data.user.name);
      if (data.user?.avatarUrl) localStorage.setItem('pune_user_avatar', data.user.avatarUrl);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
};

export const registerUser = async (name, email, password) => {
  clearApiCache();
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, 'Registration failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('pune_auth_token', data.token);
      if (data.user?.name) localStorage.setItem('pune_user_name', data.user.name);
      if (data.user?.avatarUrl) localStorage.setItem('pune_user_avatar', data.user.avatarUrl);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
};

export const googleAuthUser = async (googleData) => {
  clearApiCache();
  try {
    const response = await fetch(`${API_BASE_URL}/user/google-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData)
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, 'Google authentication failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('pune_auth_token', data.token);
      if (data.user?.name) localStorage.setItem('pune_user_name', data.user.name);
      if (data.user?.avatarUrl) localStorage.setItem('pune_user_avatar', data.user.avatarUrl);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
};

export const requestForgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, 'Failed to request OTP');
    }
    return response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
};

export const triggerAutoDispatchSos = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/auto-dispatch-sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.warn('Auto dispatch SOS response not ok:', response.status);
    }
    return response.json();
  } catch (err) {
    console.warn('Background auto dispatch SOS exception:', err);
    return { success: false };
  }
};

export const resetPasswordWithOTP = async (email, otp, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, 'Failed to reset password');
    }
    return response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
};

export const fetchUserMe = async () => {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  const data = await response.json();
  if (data.name) localStorage.setItem('pune_user_name', data.name);
  if (data.avatarUrl) localStorage.setItem('pune_user_avatar', data.avatarUrl);
  return data;
};

export const logoutUser = () => {
  clearApiCache();
  localStorage.removeItem('pune_auth_token');
  localStorage.removeItem('pune_user_name');
  localStorage.removeItem('pune_user_bio');
  localStorage.removeItem('pune_user_avatar');
};

export const fetchPlaces = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.q) query.append('q', params.q);
  if (params.isSaved) query.append('isSaved', 'true');
  if (params.isDiscovered) query.append('isDiscovered', 'true');

  const url = `${API_BASE_URL}/places?${query.toString()}`;
  const cached = getCached(url);
  if (cached) return cached;

  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch places');
  const data = await response.json();
  setCache(url, data);
  return data;
};

export const fetchEvents = async () => {
  const cacheKey = `${API_BASE_URL}/events`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch events');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const fetchItinerary = async () => {
  const cacheKey = `${API_BASE_URL}/itinerary`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch itinerary');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const updateStopStatus = async (id, done) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/stops/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ done })
  });
  if (!response.ok) throw new Error('Failed to update stop status');
  clearApiCache('http');
  return response.json();
};

export const addStopToItinerary = async (payloadOrDayId, placeId) => {
  let bodyData = {};
  if (typeof payloadOrDayId === 'object' && payloadOrDayId !== null) {
    bodyData = payloadOrDayId;
  } else {
    bodyData = { itineraryDayId: payloadOrDayId, placeId };
  }

  const response = await fetch(`${API_BASE_URL}/itinerary/stops`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, 'Failed to add stop to itinerary');
  }

  clearApiCache('http');
  return response.json();
};

export const deleteStopFromItinerary = async (id) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/stops/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete stop');
  clearApiCache('http');
  return response.json();
};

export const toggleSavePlace = async (id, isSaved) => {
  const response = await fetch(`${API_BASE_URL}/places/${id}/save`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isSaved })
  });
  if (!response.ok) throw new Error('Failed to toggle save status');
  clearApiCache('http');
  return response.json();
};

export const fetchUserStats = async () => {
  const cacheKey = `${API_BASE_URL}/user/stats`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch user stats');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const optimizeItinerary = async (itineraryDayId, mode) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/optimize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ itineraryDayId, mode })
  });
  if (!response.ok) throw new Error('Failed to optimize itinerary');
  clearApiCache('http');
  return response.json();
};

export const generateItinerary = async (generationParams) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(generationParams)
  });
  if (!response.ok) throw new Error('Failed to generate itinerary');
  clearApiCache('http');
  return response.json();
};

export const fetchWeather = async () => {
  const cacheKey = `${API_BASE_URL}/weather`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch weather status');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const adaptItineraryForWeather = async (itineraryDayId, userLanguage) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/adapt-weather`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ itineraryDayId, userLanguage })
  });
  if (!response.ok) throw new Error('Failed to adapt itinerary for weather');
  clearApiCache('http');
  return response.json();
};

export const shareItinerary = async (itineraryId) => {
  const response = await fetch(`${API_BASE_URL}/itinerary/share`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ itineraryId })
  });
  if (!response.ok) throw new Error('Failed to share itinerary');
  return response.json();
};

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('pune_auth_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    const serverHost = API_BASE_URL.replace(/\/api$/, '');
    return data.imageUrl.startsWith('http') ? data.imageUrl : `${serverHost}${data.imageUrl}`;
  } catch (err) {
    console.warn('Backend image upload fallback triggered:', err.message);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

export const createPost = async (caption, imageUrl) => {
  const response = await fetch(`${API_BASE_URL}/social/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ caption, imageUrl }),
  });
  if (!response.ok) throw new Error('Failed to create post');
  clearApiCache('social:feed');
  return response.json();
};

export const getSocialFeed = async (page = 1, limit = 10) => {
  const cacheKey = `social:feed:${page}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  const response = await fetch(`${API_BASE_URL}/social/feed?${query.toString()}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch social feed');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const addCommentToPost = async (postId, text) => {
  const response = await fetch(`${API_BASE_URL}/social/posts/${postId}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  clearApiCache('social:feed');
  return response.json();
};

export const togglePostLike = async (postId) => {
  const response = await fetch(`${API_BASE_URL}/social/posts/${postId}/like`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to toggle like');
  clearApiCache('social:feed');
  return response.json();
};

export const toggleFollowUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/social/users/${userId}/toggle-follow`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to toggle follow status');
  return response.json();
};

export const fetchPostById = async (postId) => {
  const cacheKey = `social:post:${postId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}/social/posts/${postId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch post');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const fetchUserProfile = async (userId) => {
  const cacheKey = `user:profile:${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const getPopularPosts = async () => {
  const cacheKey = 'social:posts:popular';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}/social/posts/popular`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch popular posts');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const fetchUserActivity = async (userId) => {
  const cacheKey = `user:activity:${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}/user/${userId}/activity`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch user activity');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};
