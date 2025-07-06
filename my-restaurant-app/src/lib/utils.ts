import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handle401Logout() {
  sessionStorage.clear();
  // Optionally, you can also clear localStorage if used
  // localStorage.clear();
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
