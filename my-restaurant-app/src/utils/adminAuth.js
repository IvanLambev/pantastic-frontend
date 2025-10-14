// Global fetch wrapper for admin requests
export async function fetchWithAdminAuth(url, options = {}) {
  let adminUser = sessionStorage.getItem("adminUser");
  let access_token = null;
  
  if (adminUser) {
    try {
      const parsedUser = JSON.parse(adminUser);
      access_token = parsedUser.access_token;
    } catch (error) {
      console.error("Error parsing admin user data:", error)
    }
  }
  
  // Set Authorization header if access_token exists
  if (access_token) {
    options.headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${access_token}`,
    };
  }
  
  const response = await fetch(url, options);
  
  // If admin token is invalid, logout
  if (response.status === 401) {
    sessionStorage.removeItem("adminUser");
    window.location.href = "/admin/login";
    throw new Error("Unauthorized admin access. Logging out.");
  }
  
  return response;
}