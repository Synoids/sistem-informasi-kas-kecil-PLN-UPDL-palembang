import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

export const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value;
    } catch (error) {
      // Supabase expects null if key doesn't exist
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStoragePlugin.set({ key, value });
    } catch (error) {
      console.error('Error setting item in secure storage', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch (error) {
      console.error('Error removing item from secure storage', error);
    }
  }
};
