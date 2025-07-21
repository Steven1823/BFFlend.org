import type { Request, Response } from 'express';
import { storage } from '../../lib/storage';
import { 
  validateUser, 
  validateUserUpdate, 
  sanitizeUser,
  UserQuerySchema,
  type UserResponse 
} from '../db/models';
import { z } from 'zod';

export class UserController {
  /**
   * Get user by ID
   */
  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = UserQuerySchema.parse(req.params);
      
      const user = await storage.getUser(id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const userResponse: UserResponse = sanitizeUser(user);
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Invalid user ID', 
          details: error.errors[0]?.message 
        });
        return;
      }
      
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      
      if (!username || username.length < 3) {
        res.status(400).json({ error: 'Invalid username' });
        return;
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const userResponse: UserResponse = sanitizeUser(user);
      res.json(userResponse);
    } catch (error) {
      console.error('Get user by username error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  /**
   * Create new user
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = validateUser(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      // TODO: Hash password before storing (implement bcrypt)
      // const hashedPassword = await bcrypt.hash(userData.password, 10);
      // userData.password = hashedPassword;

      const user = await storage.createUser(userData);
      const userResponse: UserResponse = sanitizeUser(user);
      
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = UserQuerySchema.parse(req.params);
      const updateData = validateUserUpdate(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if username is being changed and if it's already taken
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(updateData.username);
        if (userWithSameUsername) {
          res.status(409).json({ error: 'Username already taken' });
          return;
        }
      }

      // TODO: Hash password if being updated
      // if (updateData.password) {
      //   updateData.password = await bcrypt.hash(updateData.password, 10);
      // }

      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const userResponse: UserResponse = sanitizeUser(updatedUser);
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = UserQuerySchema.parse(req.params);
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Invalid user ID', 
          details: error.errors[0]?.message 
        });
        return;
      }
      
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Get all users (admin function)
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add authentication/authorization check for admin users
      
      const users = await storage.getAllUsers();
      const userResponses: UserResponse[] = users.map(sanitizeUser);
      
      res.json(userResponses);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
}