import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Platform } from "react-native";

import { API_BASE_URL } from "../config";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const getExtensionFromMime = (mimeType) => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
};

const inferMimeTypeFromUri = (uri = "") => {
  const cleanUri = uri.split("?")[0].toLowerCase();
  if (cleanUri.endsWith(".png")) return "image/png";
  if (cleanUri.endsWith(".webp")) return "image/webp";
  if (cleanUri.endsWith(".jpeg") || cleanUri.endsWith(".jpg")) {
    return "image/jpeg";
  }
  return "image/jpeg";
};

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = typeof fn === "function" ? fn : null;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout for uploads
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("@bondus_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor to handle 401s after data reseed or expired sessions
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        await AsyncStorage.removeItem("@bondus_auth_token");
        await AsyncStorage.removeItem("@bondus_user");
      } catch {}
      if (unauthorizedHandler) {
        try {
          unauthorizedHandler();
        } catch {}
      }
    }
    return Promise.reject(error);
  },
);

// Helper to extract clean error messages
const getErrorMessage = (error) => {
  if (error?.code === "ECONNABORTED") {
    return "Upload timed out. Please try a smaller image.";
  }

  if (error.response) {
    const data = error.response.data;
    if (error.response.status === 413) {
      return "Image is too large. Please upload an image up to 8MB.";
    }
    // If backend returned a plain string (e.g. rate limiter), use it directly
    if (typeof data === "string") return data;
    // If backend returned JSON with a message field
    if (data && data.message) return data.message;
    // Fallback
    return `Request failed (${error.response.status})`;
  } else if (error.request) {
    // The request was made but no response was received
    return "Connection failed. Please check your internet and server connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || "An unexpected error occurred";
  }
};

export const authService = {
  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getMe: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  checkEmail: async (email) => {
    try {
      const response = await apiClient.post("/auth/check-email", { email });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  validateReferralCode: async (code) => {
    try {
      const response = await apiClient.get(`/auth/referral/validate/${code}`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  uploadImage: async (imageInput) => {
    try {
      const imageAsset =
        typeof imageInput === "string" ? { uri: imageInput } : imageInput || {};
      const imageUri = imageAsset?.uri;

      if (!imageUri) {
        throw { message: "No image selected. Please try again." };
      }

      const mimeType = (
        imageAsset?.mimeType || inferMimeTypeFromUri(imageUri)
      ).toLowerCase();

      if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
        throw { message: "Only JPG, PNG, or WEBP images are supported." };
      }

      if (
        typeof imageAsset?.fileSize === "number" &&
        imageAsset.fileSize > MAX_UPLOAD_SIZE_BYTES
      ) {
        throw {
          message: "Image is too large. Please upload an image up to 8MB.",
        };
      }

      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        if (blob.size > MAX_UPLOAD_SIZE_BYTES) {
          throw {
            message: "Image is too large. Please upload an image up to 8MB.",
          };
        }
        const ext = getExtensionFromMime(mimeType);
        formData.append("image", blob, `upload.${ext}`);
      } else {
        const ext = getExtensionFromMime(mimeType);
        formData.append("image", {
          uri: imageUri,
          name: `upload.${ext}`,
          type: mimeType,
        });
      }

      let response;
      try {
        response = await apiClient.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (firstError) {
        const shouldRetry =
          firstError?.code === "ECONNABORTED" || !firstError?.response;

        if (!shouldRetry) {
          throw firstError;
        }

        response = await apiClient.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      console.log("[Upload] Success:", response.data?.url);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getInterests: async () => {
    try {
      const response = await apiClient.get("/interests");
      return response.data.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  addCustomInterest: async (category, subcategory) => {
    try {
      const response = await apiClient.post("/interests", {
        category,
        subcategory,
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  updateLocation: async (latitude, longitude) => {
    try {
      const response = await apiClient.patch("/auth/me", {
        location: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
        },
      });
      return response.data;
    } catch (error) {
      console.error("Location sync failed:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  updateMe: async (updates) => {
    try {
      const response = await apiClient.patch("/auth/me", updates);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await apiClient.patch("/auth/me", updates);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getNearbyUsers: async (params = {}) => {
    try {
      // params can include maxDistance, interest, isOnline
      const response = await apiClient.get("/users/discover", { params });
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getOnlineUsers: async (maxDistance = 100) => {
    try {
      const response = await apiClient.get("/users/discover", {
        params: { isOnline: true, maxDistance },
      });
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getGroups: async () => {
    try {
      const response = await apiClient.get("/groups");
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getMyGroups: async () => {
    try {
      const response = await apiClient.get("/groups/my-groups");
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  createGroup: async (groupData) => {
    try {
      const response = await apiClient.post("/groups", groupData);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  // ── Social & Connections ──────────────────────────────────────────────────

  getConnections: async () => {
    try {
      const response = await apiClient.get("/connections/my-friends");
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getPendingRequests: async () => {
    try {
      const response = await apiClient.get("/connections/pending");
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  sendConnectionRequest: async (userId, message = "") => {
    try {
      const response = await apiClient.post(`/connections/request/${userId}`, {
        message,
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  resolveConnectionRequest: async (requestId, status) => {
    try {
      // status can be 'accepted' or 'rejected'
      const response = await apiClient.patch(
        `/connections/resolve/${requestId}`,
        { status },
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getConnectionStatus: async (userId) => {
    try {
      const response = await apiClient.get(`/connections/status/${userId}`);
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  blockUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/block/${userId}`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  reportUser: async (userId, reason) => {
    try {
      const response = await apiClient.post(`/connections/report/${userId}`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  unblockUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/unblock/${userId}`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getBlockedUsers: async () => {
    try {
      const response = await apiClient.get("/connections/blocked");
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  joinGroup: async (groupId) => {
    try {
      const response = await apiClient.post(`/groups/${groupId}/join`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  updateGroup: async (groupId, groupData) => {
    try {
      const response = await apiClient.put(`/groups/${groupId}`, groupData);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  addGroupMembers: async (groupId, memberIds) => {
    try {
      const response = await apiClient.post(`/groups/${groupId}/members`, {
        memberIds,
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  removeGroupMember: async (groupId, userId) => {
    try {
      const response = await apiClient.delete(
        `/groups/${groupId}/members/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  updateMemberRole: async (groupId, userId, role) => {
    try {
      const response = await apiClient.patch(
        `/groups/${groupId}/members/${userId}/role`,
        { role },
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  handleGroupRequest: async (groupId, userId, action) => {
    try {
      const response = await apiClient.post(
        `/groups/${groupId}/requests/${userId}`,
        { action },
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const response = await apiClient.post(
        `/messages/${messageId}/reactions`,
        { emoji },
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  // ── Messaging ─────────────────────────────────────────────────────────────

  markMessageAsDelivered: async (messageId) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}/delivered`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  markMessageAsRead: async (messageId) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getChatMessages: async (userId) => {
    try {
      const response = await apiClient.get(`/messages/chat/${userId}`);
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getGroupMessages: async (groupId) => {
    try {
      const response = await apiClient.get(`/messages/group/${groupId}`);
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  sendMessage: async (messageData) => {
    try {
      // messageData: { receiverId, groupId, text }
      const response = await apiClient.post("/messages", messageData);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await apiClient.get("/notifications", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  getUnreadNotificationsCount: async () => {
    try {
      const response = await apiClient.get("/notifications/unread-count");
      return response.data?.data?.count || 0;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  markNotificationRead: async (notificationId = null) => {
    try {
      const url = notificationId
        ? `/notifications/${notificationId}/read`
        : "/notifications/read-all";
      const response = await apiClient.patch(url);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(
        `/notifications/${notificationId}`,
      );
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  clearAllNotifications: async () => {
    try {
      const response = await apiClient.delete("/notifications");
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  // ── Settings ──────────────────────────────────────────────────────────────

  updateSettings: async (settings) => {
    try {
      const response = await apiClient.patch("/auth/settings", settings);
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  deleteMe: async () => {
    try {
      await apiClient.delete("/auth/me");
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },

  upgradeToPremium: async () => {
    try {
      const response = await apiClient.post("/users/upgrade");
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) };
    }
  },
};

export default apiClient;
