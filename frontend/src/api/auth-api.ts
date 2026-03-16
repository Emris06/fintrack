import api from '@/lib/axios';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@/types';

export const login = (data: LoginRequest) =>
  api.post<ApiResponse<AuthResponse>>('/api/auth/login', data).then((r) => r.data.data);

export const register = (data: RegisterRequest) =>
  api.post<ApiResponse<AuthResponse>>('/api/auth/register', data).then((r) => r.data.data);

export const refreshToken = (token: string) =>
  api.post<ApiResponse<AuthResponse>>('/api/auth/refresh', null, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.data.data);

export const getMe = () =>
  api.get<ApiResponse<UserResponse>>('/api/auth/me').then((r) => r.data.data);
