// Type declarations for AdminContext
declare module "@/context/AdminContext" {
  export const useAdminAuth: () => {
    isAdminLoggedIn: boolean;
    adminToken: string | null;
    adminLogin: (email: string, password: string) => Promise<{success: boolean, data?: any, error?: string}>;
    adminLogout: () => void;
    verifyAdminToken: (token: string) => Promise<{success: boolean, data?: any, error?: string}>;
    isAdminEnabled: () => boolean;
    loading: boolean;
  };
  
  export const AdminProvider: React.FC<{children: React.ReactNode}>;
}