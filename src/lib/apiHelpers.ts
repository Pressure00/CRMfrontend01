import type { AxiosResponse } from 'axios';

// Helper type to extract data from AxiosResponse
export type ApiResponse<T> = AxiosResponse<T>;

// Helper function to get data from response
export const getResponseData = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Wrapper for API calls that returns data directly
export const createApiCall = <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  return promise.then(response => response.data);
};
