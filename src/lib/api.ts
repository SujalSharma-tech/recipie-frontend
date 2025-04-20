// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"; // Update with your API URL

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private static token: string | null = localStorage.getItem("auth_token");

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  static async request<T>(
    endpoint: string, 
    method: string = "GET", 
    data?: any
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          message: responseData.message || "API request failed",
          errors: responseData.errors,
          status: response.status,
        };
      }

      return responseData;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, "GET");
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, "POST", data);
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, "PUT", data);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, "DELETE");
  }

  // Helper for file uploads
  static async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw {
          message: responseData.message || "API request failed",
          errors: responseData.errors,
          status: response.status,
        };
      }
      
      return responseData;
    } catch (error) {
      console.error("API upload error:", error);
      throw error;
    }
  }

  // Update your putFormData method to explicitly handle the method override
  static async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    // Make sure _method is one of the first fields added
    const newFormData = new FormData();
    newFormData.append('_method', 'PUT'); // Add this first
    
    // Copy all fields from the original formData
    for (const [key, value] of formData.entries()) {
      if (key !== '_method') { // Avoid duplicate _method field
        newFormData.append(key, value);
      }
    }

    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'X-HTTP-Method-Override': 'PUT', // Add an extra header for method override
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log('PUT FormData request:', endpoint);
    console.log('FormData contents:');
    for (const pair of newFormData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: newFormData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server response:', responseData);
        throw {
          message: responseData.message || "API request failed",
          errors: responseData.errors,
          status: response.status,
        };
      }

      return responseData;
    } catch (error) {
      console.error("API putFormData error:", error);
      throw error;
    }
  }
}

export default ApiClient;