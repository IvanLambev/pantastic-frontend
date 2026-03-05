// Global fetch wrapper for admin requests.
// Backend contract: cookie auth only, credentials included, no Bearer headers.
export async function fetchWithAdminAuth(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const mergedHeaders = {
    ...(options.headers || {}),
  };

  if (!isFormData && !mergedHeaders["Content-Type"]) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  if (isFormData && mergedHeaders["Content-Type"]) {
    delete mergedHeaders["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    const errorText = await response.text();
    throw new Error(`Access forbidden: ${errorText || "Insufficient permissions"}`);
  }

  return response;
}