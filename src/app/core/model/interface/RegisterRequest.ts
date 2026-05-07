export interface RegisterRequest {
      username: string;
      email: string;
      password: string;
      phone: string;
      birthDate: string; // ISO format YYYY-MM-DD
      gender: 'MALE' | 'FEMALE';
      address?: string;
}