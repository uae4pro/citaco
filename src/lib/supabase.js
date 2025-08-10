import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL - Please set it in your .env file');
}
if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY - Please set it in your .env file');
}

// Create Supabase client with anon key (for public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable Supabase auth since we're using Clerk
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: 'supabase-anon-auth'
  },
  realtime: {
    // Enable realtime features if needed
    params: {
      eventsPerSecond: 10
    }
  }
});

// Create admin client for user management (bypasses RLS)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'supabase-admin-auth'
      }
    })
  : supabase; // Fallback to regular client if no service key

// Database helper functions
export const supabaseHelpers = {
  // Users table operations
  users: {
    async create(userData) {
      console.log('🔧 Supabase: Creating user with data:', userData);
      // Use admin client to bypass RLS policies
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create error:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        throw error;
      }
      console.log('✅ Supabase: User created successfully:', data);
      return data;
    },

    async getByClerkId(clerkUserId) {
      console.log('🔍 Supabase: Looking for user with Clerk ID:', clerkUserId);
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Supabase getByClerkId error:', error);
        throw error;
      }
      console.log('🔍 Supabase: User lookup result:', data ? 'Found' : 'Not found');
      return data;
    },

    async getByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },



    async upsert(userData) {
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getAll() {
      console.log('🔍 Supabase: Loading all users...');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        console.error('❌ Supabase getAll users error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'users');
      return data || [];
    },

    async update(userId, updateData) {
      console.log('🔧 Supabase: Updating user:', userId, updateData);

      // Determine if userId is a clerk_user_id (string) or database id (integer)
      const isClerkId = typeof userId === 'string' && userId.startsWith('user_');
      const whereClause = isClerkId ? 'clerk_user_id' : 'id';

      console.log('🔧 Using where clause:', whereClause, '=', userId);

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          ...updateData,
          updated_date: new Date().toISOString()
        })
        .eq(whereClause, userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update user error:', error);
        throw error;
      }
      console.log('✅ Supabase: User updated successfully:', data);
      return data;
    }
  },

  // Cart operations
  cart: {
    async getItems(clerkUserId) {
      console.log('🔍 Supabase: Loading cart items for user:', clerkUserId);
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select(`
          *,
          spare_parts (
            id,
            name,
            price,
            image_urls,
            stock_quantity,
            part_number
          )
        `)
        .eq('clerk_user_id', clerkUserId)
        .order('added_date', { ascending: false });

      if (error) {
        console.error('❌ Supabase get cart items error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'cart items');
      return data || [];
    },

    async addItem(clerkUserId, userEmail, sparePartId, quantity) {
      console.log('🔧 Supabase: Adding item to cart:', { clerkUserId, sparePartId, quantity });
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .upsert({
          clerk_user_id: clerkUserId,
          user_email: userEmail,
          spare_part_id: sparePartId,
          quantity: quantity,
          added_date: new Date().toISOString()
        }, {
          onConflict: 'clerk_user_id,spare_part_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase add cart item error:', error);
        throw error;
      }
      console.log('✅ Supabase: Item added to cart successfully:', data);
      return data;
    },

    async updateQuantity(clerkUserId, sparePartId, quantity) {
      console.log('🔧 Supabase: Updating cart quantity:', { clerkUserId, sparePartId, quantity });
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({
          quantity,
          updated_date: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId)
        .eq('spare_part_id', sparePartId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update cart quantity error:', error);
        throw error;
      }
      console.log('✅ Supabase: Cart quantity updated successfully:', data);
      return data;
    },

    async removeItem(clerkUserId, sparePartId) {
      console.log('🔧 Supabase: Removing item from cart:', { clerkUserId, sparePartId });
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('clerk_user_id', clerkUserId)
        .eq('spare_part_id', sparePartId);

      if (error) {
        console.error('❌ Supabase remove cart item error:', error);
        throw error;
      }
      console.log('✅ Supabase: Item removed from cart successfully');
      return true;
    },

    async clearCart(clerkUserId) {
      console.log('🔧 Supabase: Clearing cart for user:', clerkUserId);
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('clerk_user_id', clerkUserId);

      if (error) {
        console.error('❌ Supabase clear cart error:', error);
        throw error;
      }
      console.log('✅ Supabase: Cart cleared successfully');
      return true;
    }
  },

  // Orders operations
  orders: {
    async getUserOrders(clerkUserId) {
      console.log('🔍 Supabase: Loading orders for user:', clerkUserId);
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            spare_parts (
              name,
              part_number,
              image_urls
            )
          )
        `)
        .eq('clerk_user_id', clerkUserId)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('❌ Supabase get user orders error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'user orders');
      return data || [];
    },

    async create(orderData) {
      console.log('🔧 Supabase: Creating order:', orderData);

      // Add required fields with defaults
      const orderWithDefaults = {
        ...orderData,
        order_number: `ORD-${Date.now()}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert([orderWithDefaults])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create order error:', error);
        console.error('Order data that failed:', orderWithDefaults);
        throw error;
      }
      console.log('✅ Supabase: Order created successfully:', data);
      return data;
    },

    async createOrderItem(orderItemData) {
      console.log('🔧 Supabase: Creating order item:', orderItemData);

      const { data, error } = await supabaseAdmin
        .from('order_items')
        .insert([orderItemData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create order item error:', error);
        console.error('Order item data that failed:', orderItemData);
        throw error;
      }
      console.log('✅ Supabase: Order item created successfully:', data);
      return data;
    },

    async getAll(filters = {}) {
      console.log('🔍 Supabase: Loading all orders...');
      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            spare_parts (
              name,
              part_number,
              image_urls
            )
          )
        `)
        .order('created_date', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase getAll orders error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'orders');
      return data || [];
    },

    async update(orderId, updateData) {
      console.log('🔧 Supabase: Updating order:', orderId, updateData);
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          ...updateData,
          updated_date: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update order error:', error);
        throw error;
      }
      console.log('✅ Supabase: Order updated successfully:', data);
      return data;
    }
  },

  // Spare parts operations
  parts: {
    async getAll(filters = {}) {
      let query = supabaseAdmin
        .from('spare_parts')
        .select('*');

      // For admin, show all parts (active and inactive)
      // Remove the is_active filter to show all parts in admin

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_date';
      const sortOrder = filters.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase parts getAll error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'parts');
      return data || [];
    },

    async create(partData) {
      console.log('🔧 Supabase: Creating part with data:', partData);

      // Calculate final price based on discount
      const originalPrice = partData.original_price || partData.price || 0;
      const finalPrice = partData.is_on_sale && partData.discount_percentage > 0
        ? originalPrice * (1 - (partData.discount_percentage / 100))
        : originalPrice;

      const partWithPricing = {
        ...partData,
        original_price: originalPrice,
        price: finalPrice,
        discount_percentage: partData.discount_percentage || 0,
        is_on_sale: partData.is_on_sale || false,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('spare_parts')
        .insert([partWithPricing])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create part error:', error);
        throw error;
      }
      console.log('✅ Supabase: Part created successfully:', data);
      return data;
    },

    async update(partId, updateData) {
      console.log('🔧 Supabase: Updating part:', partId, updateData);

      // Calculate final price based on discount
      const originalPrice = updateData.original_price || updateData.price || 0;
      const finalPrice = updateData.is_on_sale && updateData.discount_percentage > 0
        ? originalPrice * (1 - (updateData.discount_percentage / 100))
        : originalPrice;

      const dataWithPricing = {
        ...updateData,
        original_price: originalPrice,
        price: finalPrice,
        updated_date: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('spare_parts')
        .update(dataWithPricing)
        .eq('id', partId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update part error:', error);
        throw error;
      }
      console.log('✅ Supabase: Part updated successfully:', data);
      return data;
    },

    async delete(partId) {
      console.log('🔧 Supabase: Deleting part:', partId);
      const { error } = await supabaseAdmin
        .from('spare_parts')
        .delete()
        .eq('id', partId);

      if (error) {
        console.error('❌ Supabase delete part error:', error);
        throw error;
      }
      console.log('✅ Supabase: Part deleted successfully');
      return true;
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  },

  // App settings operations
  settings: {
    async getAll() {
      console.log('🔍 Supabase: Loading app settings...');
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) {
        console.error('❌ Supabase settings getAll error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'settings');

      // Convert array of key-value pairs to object
      const settingsObj = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      return settingsObj;
    },

    async updateSetting(key, value, description = null) {
      console.log('🔧 Supabase: Updating setting:', key, '=', value);
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description,
          updated_date: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update setting error:', error);
        throw error;
      }
      console.log('✅ Supabase: Setting updated successfully:', data);
      return data;
    },

    async updateMultiple(settingsObj) {
      console.log('🔧 Supabase: Updating multiple settings:', settingsObj);
      const results = [];

      for (const [key, value] of Object.entries(settingsObj)) {
        if (value !== undefined && value !== null) {
          const result = await this.updateSetting(key, value);
          results.push(result);
        }
      }

      console.log('✅ Supabase: Updated', results.length, 'settings');
      return results;
    },

    async getCurrent() {
      return await this.getAll();
    }
  },

  // Categories operations
  categories: {
    async getAll() {
      console.log('🔍 Supabase: Loading categories...');
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Supabase categories getAll error:', error);
        throw error;
      }

      // Get parts count for each category separately
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabaseAdmin
            .from('spare_parts')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name);

          return {
            ...category,
            parts_count: count || 0
          };
        })
      );

      console.log('✅ Supabase: Loaded', categoriesWithCount.length, 'categories');
      return categoriesWithCount;
    },

    async getActive() {
      console.log('🔍 Supabase: Loading active categories...');
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Supabase active categories error:', error);
        throw error;
      }
      console.log('✅ Supabase: Loaded', data?.length || 0, 'active categories');
      return data || [];
    },

    async create(categoryData) {
      console.log('🔧 Supabase: Creating category:', categoryData);
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create category error:', error);
        throw error;
      }
      console.log('✅ Supabase: Category created successfully:', data);
      return data;
    },

    async update(categoryId, updateData) {
      console.log('🔧 Supabase: Updating category:', categoryId, updateData);
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update category error:', error);
        throw error;
      }
      console.log('✅ Supabase: Category updated successfully:', data);
      return data;
    },

    async delete(categoryId) {
      console.log('🔧 Supabase: Deleting category:', categoryId);
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('❌ Supabase delete category error:', error);
        throw error;
      }
      console.log('✅ Supabase: Category deleted successfully');
      return true;
    }
  },

  // Storage operations
  storage: {
    bucketName: import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'autoparts-images',

    async uploadImage(file, path) {
      console.log('🔧 Supabase: Uploading image:', path);

      // Generate unique filename if not provided
      const fileName = path || `${Date.now()}-${file.name}`;

      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      console.log('✅ Supabase: Image uploaded successfully:', data.path);
      return data;
    },

    async deleteImage(path) {
      console.log('🔧 Supabase: Deleting image:', path);

      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw error;
      }

      console.log('✅ Supabase: Image deleted successfully');
      return data;
    },

    getPublicUrl(path) {
      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return data.publicUrl;
    },

    async listImages(folder = '') {
      console.log('🔍 Supabase: Listing images in folder:', folder);

      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .list(folder, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('❌ Supabase list error:', error);
        throw error;
      }

      console.log('✅ Supabase: Listed', data?.length || 0, 'images');
      return data || [];
    },

    // Helper function to upload multiple images
    async uploadMultipleImages(files, folderPath = '') {
      const uploadPromises = files.map((file, index) => {
        const fileName = folderPath ?
          `${folderPath}/${Date.now()}-${index}-${file.name}` :
          `${Date.now()}-${index}-${file.name}`;
        return this.uploadImage(file, fileName);
      });

      const results = await Promise.all(uploadPromises);
      return results;
    }
  }
};

export default supabase;
