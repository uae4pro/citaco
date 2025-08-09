import Joi from 'joi';

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zip_code: Joi.string().optional(),
    country: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zip_code: Joi.string().optional(),
    country: Joi.string().optional()
  })
};

// Spare part validation schemas
export const sparePartSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    part_number: Joi.string().min(2).max(100).required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    category: Joi.string().valid(
      'engine', 'transmission', 'brakes', 'suspension', 
      'electrical', 'body', 'interior', 'exhaust', 
      'cooling', 'fuel_system', 'accessory'
    ).required(),
    brand: Joi.string().min(2).max(100).required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
    image_urls: Joi.array().items(Joi.string().uri()).optional(),
    compatibility: Joi.array().items(Joi.string()).optional(),
    warranty_months: Joi.number().integer().positive().optional(),
    cost_price: Joi.number().positive().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    part_number: Joi.string().min(2).max(100).optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string().valid(
      'engine', 'transmission', 'brakes', 'suspension', 
      'electrical', 'body', 'interior', 'exhaust', 
      'cooling', 'fuel_system', 'accessory'
    ).optional(),
    brand: Joi.string().min(2).max(100).optional(),
    stock_quantity: Joi.number().integer().min(0).optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
    image_urls: Joi.array().items(Joi.string().uri()).optional(),
    compatibility: Joi.array().items(Joi.string()).optional(),
    warranty_months: Joi.number().integer().positive().optional(),
    cost_price: Joi.number().positive().optional()
  })
};

// Cart item validation schemas
export const cartItemSchemas = {
  add: Joi.object({
    spare_part_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().positive().required()
  }),

  update: Joi.object({
    quantity: Joi.number().integer().positive().required()
  })
};

// Order validation schemas
export const orderSchemas = {
  create: Joi.object({
    shipping_address: Joi.string().required(),
    billing_address: Joi.string().optional(),
    payment_method: Joi.string().required(),
    notes: Joi.string().optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 
      'shipped', 'delivered', 'cancelled', 'refunded'
    ).required(),
    tracking_number: Joi.string().optional(),
    notes: Joi.string().optional()
  })
};

// App settings validation schema
export const appSettingsSchema = {
  update: Joi.object({
    app_name: Joi.string().min(2).max(255).optional(),
    currency: Joi.string().length(3).optional(),
    tax_rate: Joi.number().min(0).max(1).optional(),
    shipping_cost: Joi.number().min(0).optional(),
    free_shipping_threshold: Joi.number().min(0).optional(),
    business_email: Joi.string().email().optional(),
    business_phone: Joi.string().optional(),
    business_address: Joi.string().optional(),
    logo_url: Joi.string().uri().optional(),
    theme_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    maintenance_mode: Joi.boolean().optional()
  })
};
