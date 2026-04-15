import bcrypt from 'bcryptjs';
import { storage } from './storage';

class AuthService {
  async register(username: string, email: string, password: string, firstName?: string, lastName?: string, role?: 'teacher' | 'student') {
    // Check if username or email already exists
    const existingUser = await storage.getUserByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user with specified role (defaults to student)
    const userData = {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    };

    const user = await storage.createUser(userData);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(identifier: string, password: string) {
    // Find user by username or email
    const user = await storage.getUserByUsernameOrEmail(identifier, identifier);
    if (!user) {
      return null;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();