import { API_URL } from '@/config/api';

// Helper function to refresh admin tokens
async function refreshAdminTokens() {
  const adminUser = sessionStorage.getItem("adminUser");
  if (!adminUser) {
    throw new Error("No admin session found");
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(adminUser);
  } catch (error) {
    console.error('Error parsing admin session:', error);
    throw new Error("Invalid admin session data");
  }

  const refresh_token = parsedUser.refresh_token;
  if (!refresh_token) {
    throw new Error("No refresh token available for admin");
  }

  console.log('🔄 Refreshing admin tokens...');

  try {
    const response = await fetch(`${API_URL}/user/refresh-token?refresh_token=${encodeURIComponent(refresh_token)}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        refresh_token: refresh_token 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.detail === "Invalid refresh token") {
        sessionStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        throw new Error("Admin refresh token expired. Please log in again.");
      }
      throw new Error("Failed to refresh admin tokens");
    }

    const data = await response.json();
    
    if (data.access_token && data.token_type === 'bearer') {
      // Update tokens in sessionStorage
      parsedUser.access_token = data.access_token;
      if (data.refresh_token) {
        parsedUser.refresh_token = data.refresh_token;
      }
      
      sessionStorage.setItem("adminUser", JSON.stringify(parsedUser));
      console.log('✅ Admin tokens refreshed successfully');
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token
      };
    } else {
      throw new Error("Invalid admin token refresh response format");
    }
  } catch (error) {
    console.error('❌ Error refreshing admin tokens:', error);
    throw error;
  }
}

// Global fetch wrapper for admin requests
export async function fetchWithAdminAuth(url, options = {}) {
  console.log('🔐 Admin Auth Request:', url);
  
  let adminUser = sessionStorage.getItem("adminUser");
  let access_token = null;
  let refresh_token = null;
  
  if (adminUser) {
    try {
      const parsedUser = JSON.parse(adminUser);
      access_token = parsedUser.access_token;
      refresh_token = parsedUser.refresh_token;
      console.log('🔑 Found admin token:', access_token ? `${access_token.slice(0, 20)}...` : 'null');
    } catch (error) {
      console.error("❌ Error parsing admin user data:", error)
    }
  } else {
    console.log('⚠️ No admin user in sessionStorage');
  }
  
  // Set Authorization header if access_token exists
  if (access_token) {
    options.headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${access_token}`,
    };
    console.log('✅ Authorization header set');
  } else {
    console.log('❌ No access token available');
  }
  
  let response = await fetch(url, options);
  console.log(`📡 Response status: ${response.status} for ${url}`);
  
  // Handle 401 Unauthorized responses with token refresh
  if (response.status === 401 && refresh_token) {
    console.log('🔄 Admin token expired, attempting to refresh...');
    
    try {
      const newTokens = await refreshAdminTokens();
      
      // Retry original request with new token
      options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${newTokens.access_token}`,
      };
      
      console.log('🔄 Retrying admin request with new token');
      response = await fetch(url, options);
      
      return response;
    } catch (refreshError) {
      console.error('❌ Admin token refresh failed:', refreshError);
      sessionStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
      throw new Error("Admin session expired. Please login again.");
    }
  } else if (response.status === 401) {
    console.error(`❌ Admin auth failed with status: 401 (Unauthorized) for URL: ${url}`);
    console.error('🔄 Token expired or invalid, clearing admin session and redirecting to login...');
    sessionStorage.removeItem("adminUser");
    window.location.href = "/admin/login";
    throw new Error("Admin session expired. Please login again.");
  } else if (response.status === 403) {
    console.error(`❌ Admin access forbidden with status: 403 for URL: ${url}`);
    console.error('⚠️ Admin token valid but insufficient permissions for this resource');
    // Don't automatically logout on 403 - might be endpoint-specific permissions
    const errorText = await response.text();
    throw new Error(`Access forbidden: ${errorText || 'Insufficient permissions'}`);
  }
  
  return response;
}