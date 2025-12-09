
import React, { useState, useEffect } from 'react';
import type { MealLog, MealAnalysis, DailyGoals, UserProfile, ActivityLog } from './types';
import { analyzeFoodImage } from './services/geminiService';
import { generateDailyPDF } from './services/pdfService';
import { ImageInput } from './components/ImageInput';
import { Loader } from './components/Loader';
import { ResultCard } from './components/ResultCard';
import { DailySummary } from './components/DailySummary';
import { GoalSetter } from './components/GoalSetter';
import { ActivityTracker } from './components/ActivityTracker';
import { SharedMealView } from './components/SharedMealView';
import { DocumentIcon, CameraIcon } from './components/icons';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // remove data:mime/type;base64, prefix for API calls
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

// Helper to read full base64 string for display/storage
const fileToDataURL = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
    });


export default function App() {
  const [dailyLog, setDailyLog] = useState<MealLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ weight: 0, height: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({ calories: 2000, protein: 120, carbs: 250, fat: 60, burnedCalories: 400 });
  
  // State for routing/sharing
  const [sharedMealId, setSharedMealId] = useState<string | null>(null);
  const [sharedMeal, setSharedMeal] = useState<MealLog | null>(null);

  // 1. Load Data on Mount
  useEffect(() => {
    try {
      // Goals
      const savedGoals = localStorage.getItem('nutriVisionGoals');
      if (savedGoals) {
        setDailyGoals(JSON.parse(savedGoals));
      }

      // Profile
      const savedProfile = localStorage.getItem('nutriVisionProfile');
      if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
      }

      // Meals Log
      const savedLog = localStorage.getItem('nutriVisionLog');
      let parsedLog: MealLog[] = [];
      if (savedLog) {
          parsedLog = JSON.parse(savedLog);
          setDailyLog(parsedLog);
      }

      // Activities Log
      const savedActivities = localStorage.getItem('nutriVisionActivities');
      if (savedActivities) {
          setActivities(JSON.parse(savedActivities));
      }

      // Check for Share Link (?mealId=xyz)
      const params = new URLSearchParams(window.location.search);
      const mealIdFromUrl = params.get('mealId');
      if (mealIdFromUrl) {
          setSharedMealId(mealIdFromUrl);
          const foundMeal = parsedLog.find(m => m.id === mealIdFromUrl);
          if (foundMeal) {
              setSharedMeal(foundMeal);
          } else {
              setError("Refeição não encontrada ou link expirado.");
          }
      }

    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  // 2. Persist Goals
  useEffect(() => {
    localStorage.setItem('nutriVisionGoals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  // 3. Persist Profile
  useEffect(() => {
    localStorage.setItem('nutriVisionProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  // 4. Persist Log (with Quota check)
  useEffect(() => {
      if (dailyLog.length === 0) return; 
      try {
          localStorage.setItem('nutriVisionLog', JSON.stringify(dailyLog));
      } catch (e: any) {
          if (e.name === 'QuotaExceededError') {
              setError("O armazenamento local está cheio. Refeições podem não ser salvas.");
          }
      }
  }, [dailyLog]);

  // 5. Persist Activities
  useEffect(() => {
    localStorage.setItem('nutriVisionActivities', JSON.stringify(activities));
  }, [activities]);

  const handleGoalsChange = (newGoals: DailyGoals) => {
    const numericGoals = {
        calories: Number(newGoals.calories) || 0,
        protein: Number(newGoals.protein) || 0,
        carbs: Number(newGoals.carbs) || 0,
        fat: Number(newGoals.fat) || 0,
        burnedCalories: Number(newGoals.burnedCalories) || 0,
    };
    setDailyGoals(numericGoals);
  };

  const handleImageAnalysis = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const base64ForApi = await fileToBase64(file);
      const base64ForStorage = await fileToDataURL(file);
      
      const analysisResult: MealAnalysis = await analyzeFoodImage(base64ForApi, file.type);
      
      const newMeal: MealLog = {
        ...analysisResult,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: new Date().toLocaleString(),
        imageSrc: base64ForStorage,
      };
      
      setDailyLog(prevLog => [newMeal, ...prevLog]);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = (id: string) => {
    const newLog = dailyLog.filter(meal => meal.id !== id);
    setDailyLog(newLog);
    localStorage.setItem('nutriVisionLog', JSON.stringify(newLog));
  };
  
  const handleUpdateMeal = (updatedMeal: MealLog) => {
    setDailyLog(prevLog => prevLog.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
  };

  // Activity Handlers
  const handleAddActivity = (activity: ActivityLog) => {
      setActivities(prev => [activity, ...prev]);
  };

  const handleDeleteActivity = (id: string) => {
      setActivities(prev => prev.filter(a => a.id !== id));
  };

  const clearShareView = () => {
      window.history.pushState({}, "", window.location.pathname);
      setSharedMealId(null);
      setSharedMeal(null);
      setError(null);
  };

  // --- SHARED VIEW MODE ---
  if (sharedMealId && sharedMeal) {
      return <SharedMealView meal={sharedMeal} onBack={clearShareView} />;
  }

  // --- NORMAL APP MODE ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-32">
      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        <header className="text-center mb-8 w-full relative">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            MY <span className="text-amber-400">NUTRI.IA</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Tire uma foto da sua refeição e deixe nossa IA revelar seus segredos nutricionais.
          </p>
          
          {(dailyLog.length > 0 || activities.length > 0) && (
            <button 
                onClick={() => generateDailyPDF(dailyLog, dailyGoals, activities)}
                className="mt-4 md:absolute md:right-0 md:top-0 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-amber-400 px-4 py-2 rounded-lg transition-all text-sm font-bold border border-gray-700 shadow-lg mx-auto md:mx-0"
            >
                <DocumentIcon className="w-5 h-5" />
                <span>Baixar Relatório</span>
            </button>
          )}
        </header>

        <GoalSetter goals={dailyGoals} onGoalsChange={handleGoalsChange} />
        
        {/* Main Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mb-8">
            
            {/* Left Column: Meal Registration (Blue Theme) */}
            <div className="w-full bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col h-fit">
                <div className="relative h-48 w-full">
                    <img 
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" 
                        alt="Refeição Balanceada" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-sky-800/60 flex flex-col justify-center px-6">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-500 rounded-full shadow-lg text-white">
                                <CameraIcon className="w-6 h-6" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold text-white shadow-black drop-shadow-md">Registrar Refeição</h2>
                                <p className="text-sm text-blue-200">Foto & Análise IA</p>
                             </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 flex justify-center flex-1 items-center">
                    <ImageInput onImageSelected={handleImageAnalysis} isLoading={isLoading} />
                </div>
            </div>

            {/* Right Column: Activity Tracker (Red Theme) */}
            <ActivityTracker 
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
                activities={activities}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                className="mb-0 h-fit"
            />
        </div>
        
        {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg max-w-2xl w-full text-center">
                <p className="font-bold">Atenção</p>
                <p className="text-sm">{error}</p>
                {sharedMealId && <button onClick={clearShareView} className="mt-2 underline">Ir para o App</button>}
            </div>
        )}

        {isLoading && <Loader />}

        <div className="w-full max-w-2xl mt-8">
            {dailyLog.length > 0 && !isLoading && (
                 <h2 className="text-2xl font-bold text-center mb-4 text-gray-300 border-b-2 border-gray-700 pb-2">Diário de Hoje</h2>
            )}
            {dailyLog.map(meal => (
                <ResultCard 
                    key={meal.id} 
                    meal={meal} 
                    onDelete={handleDeleteMeal}
                    onUpdate={handleUpdateMeal} 
                />
            ))}
        </div>
      </main>
      <DailySummary meals={dailyLog} goals={dailyGoals} activities={activities} />
    </div>
  );
}
