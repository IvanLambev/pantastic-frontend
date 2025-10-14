// Global fetch wrapper for admin requests
export async function fetchWithAdminAuth(url, options = {}) {
  console.log('🔐 Admin Auth Request:', url);
  
  let adminUser = sessionStorage.getItem("adminUser");
  let access_token = null;
  
  if (adminUser) {
    try {
      const parsedUser = JSON.parse(adminUser);
      access_token = parsedUser.access_token;
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
  
  const response = await fetch(url, options);
  console.log(`📡 Response status: ${response.status} for ${url}`);
  
  // Handle different error scenarios
  if (response.status === 401) {
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