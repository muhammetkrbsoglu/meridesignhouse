'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  last_sign_in_at: string | null;
}

export interface FetchUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export interface FetchUsersResult {
  users: User[];
  totalCount: number;
}

/**
 * Fetch users with pagination, search, and filtering
 */
export async function fetchUsers({
  page,
  limit,
  search = '',
  role = '',
}: FetchUsersParams): Promise<FetchUsersResult> {
  try {
    const supabase = getSupabaseAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, address, city, postal_code, country, role, createdAt, updatedAt, last_sign_in_at', { count: 'exact' })
      .order('createdAt', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], totalCount: 0 };
    }

    return {
      users: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    return { users: [], totalCount: 0 };
  }
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(id: string): Promise<User | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, address, city, postal_code, country, role, createdAt, updatedAt, last_sign_in_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchUserById:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        role,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  try {
    const supabase = getSupabaseAdmin();
    
    const [totalUsers, adminUsers, recentUsers] = await Promise.all([
      // Total users count
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true }),
      
      // Admin users count
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin'),
      
      // Recent users (last 30 days)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return {
      totalUsers: totalUsers.count || 0,
      adminUsers: adminUsers.count || 0,
      regularUsers: (totalUsers.count || 0) - (adminUsers.count || 0),
      recentUsers: recentUsers.count || 0,
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      totalUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
      recentUsers: 0,
    };
  }
}