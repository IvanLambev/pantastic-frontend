import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function handle401Logout() {
  // Call backend to clear HttpOnly cookies
  try {
    await fetch(`${process.env.VITE_API_URL || 'https://api2.palachinki.store'}/user/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error calling logout endpoint:', error);
  }
  
  // Clear all storage
  sessionStorage.clear();
  localStorage.clear();
  
  // Redirect to login
  window.location.href = "/login";
}

// export async function fetchWithAuth(url: string, options: any = {}) {
//   const response = await fetch(url, options);
//   if (response.status === 401) {
//     handle401Logout();
//     throw new Error("Unauthorized. Logging out.");
//   }
//   return response;
// }
