// User and Authentication Types
export interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Recipe Types
export interface Recipe {
  id: string
  user_id: string
  collection_id?: string
  title: string
  description?: string
  source_url: string
  source_platform: 'youtube' | 'instagram' | 'tiktok' | 'manual'
  thumbnail_url?: string
  video_id?: string
  ingredients: Ingredient[]
  instructions: Instruction[]
  prep_time?: number // minutes
  cook_time?: number // minutes
  servings?: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  is_favorite: boolean
  nutrition_info?: NutritionInfo
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  name: string
  amount: string
  unit?: string
  notes?: string
}

export interface Instruction {
  id: string
  step_number: number
  description: string
  image_url?: string
  time_required?: number // minutes
}

export interface NutritionInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
}

// Collection Types
export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  recipe_count: number
  created_at: string
  updated_at: string
}

// Inventory Types
export interface FoodItem {
  id: string
  user_id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string
  purchase_date: string
  price?: number
  location: 'fridge' | 'freezer' | 'pantry' | 'counter'
  notes?: string
  barcode?: string
  nutrition_info?: NutritionInfo
  created_at: string
  updated_at: string
}

// Shopping List Types
export interface ShoppingList {
  id: string
  user_id: string
  name: string
  items: ShoppingItem[]
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  is_purchased: boolean
  notes?: string
  estimated_price?: number
}

// Meal Planning Types
export interface MealPlan {
  id: string
  user_id: string
  name: string
  start_date: string
  end_date: string
  meals: Meal[]
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string
  recipe_id?: string
  recipe?: Recipe
  notes?: string
  servings: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Scraping Types
export interface ScrapingJob {
  id: string
  user_id: string
  url: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: Recipe
  error_message?: string
  created_at: string
  updated_at: string
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: 'expiry_alert' | 'meal_reminder' | 'shopping_reminder' | 'recipe_suggestion'
  title: string
  message: string
  is_read: boolean
  data?: Record<string, any>
  created_at: string
}
