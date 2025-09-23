import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { Property, PropertyFormData, PropertySearchParams } from '../types';

const BASE_URL = '/api';

class PropertyApiService {
  async getProperties(params?: PropertySearchParams): Promise<ApiResponse<PaginatedResponse<Property>>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            searchParams.append(key, JSON.stringify(value));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${BASE_URL}/properties?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.statusText}`);
    }

    return response.json();
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    const response = await fetch(`${BASE_URL}/properties/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.statusText}`);
    }

    return response.json();
  }

  async createProperty(data: PropertyFormData): Promise<ApiResponse<Property>> {
    const response = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create property: ${response.statusText}`);
    }

    return response.json();
  }

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<ApiResponse<Property>> {
    const response = await fetch(`${BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update property: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${BASE_URL}/properties/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete property: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadImages(propertyId: string, files: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await fetch(`${BASE_URL}/properties/${propertyId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteImage(propertyId: string, imageId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/images/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    return response.json();
  }
}

export const propertyApi = new PropertyApiService();