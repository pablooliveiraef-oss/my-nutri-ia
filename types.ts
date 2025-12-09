
export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  percentage?: number;
}

export interface MealAnalysis {
  title: string;
  description: string;
  calories: number;
  macros: Nutrient[];
  micros: Nutrient[];
  ingredients: Ingredient[];
}

export interface MealLog extends MealAnalysis {
  id: string;
  timestamp: string;
  imageSrc: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burnedCalories: number; // Meta de gasto calórico
}

export interface UserProfile {
    weight: number; // kg
    height: number; // cm
}

export interface ActivityLog {
    id: string;
    name: string;
    durationMinutes: number;
    intensity: 'Leve' | 'Moderado' | 'Vigoroso';
    metValue: number;
    caloriesBurned: number;
    timestamp: string;
}