// lib/remoteStorage.ts

const API_URL = process.env.NEXT_PUBLIC_REMOTE_STORAGE_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_REMOTE_STORAGE_API_KEY;

export interface RemoteFile {
    filename: string;
    url: string;
    size: number;
    mtime: number;
}

export const uploadFile = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!API_URL || !API_KEY) {
        return { success: false, error: 'Remote storage configuration missing' };
    }

    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file:', file.name, 'to', API_URL);

    try {
        // Adding API key as query param fallback for environments that strip headers
        const uploadUrl = new URL(API_URL);
        uploadUrl.searchParams.append('action', 'upload');
        uploadUrl.searchParams.append('api_key', API_KEY);

        const response = await fetch(uploadUrl.toString(), {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY, // Still sending header as primary method
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload API Error:', response.status, errorText);
            return { success: false, error: `Upload failed: ${response.status} ${response.statusText}` };
        }

        const data = await response.json();
        console.log('Upload response:', data);

        if (data.success) {
            return { success: true, url: data.url };
        } else {
            return { success: false, error: data.error || 'Upload failed' };
        }
    } catch (error) {
        console.error('Upload Network Error:', error);
        return { success: false, error: 'Network error or CORS issue. Check browser console.' };
    }
};

export const listFiles = async (): Promise<RemoteFile[]> => {
    if (!API_URL || !API_KEY) {
        console.error('Remote storage configuration missing');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}?action=list`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch file list: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('List Files Error:', error);
        return [];
    }
};

export const deleteFile = async (filename: string): Promise<boolean> => {
    if (!API_URL || !API_KEY) {
        console.error('Remote storage configuration missing');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}?action=delete&filename=${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Delete File Error:', error);
        return false;
    }
};
