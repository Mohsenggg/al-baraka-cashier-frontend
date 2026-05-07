export interface LoginResponse {
      token: string;
      refreshToken: string;
      expiresIn: number;
      user: {
            id: number;
            username: string;
            email: string;
            roles: string[];
      };
}