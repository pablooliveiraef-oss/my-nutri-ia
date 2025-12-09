import React from 'react';
import type { MealLog } from '../types';

interface SharedMealViewProps {
  meal: MealLog;
  onBack: () => void;
}

const calculateMacroPercentage = (macroName: string, grams: number, totalCalories: number): number => {
    if (!totalCalories || totalCalories === 0) return 0;
    const lowerName = macroName.toLowerCase();
    let caloriesPerGram = 4;
    if (lowerName.includes('gord') || lowerName.includes('fat')) caloriesPerGram = 9;
    return Math.round((grams * caloriesPerGram / totalCalories) * 100);
};

export const SharedMealView: React.FC<SharedMealViewProps> = ({ meal, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 md:p-8">
      <button 
        onClick={onBack}
        className="self-start mb-6 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para o Início
      </button>

      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {/* Header Image */}
        <div className="h-64 md:h-80 w-full relative">
           <img src={meal.imageSrc} alt={meal.title} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 shadow-black drop-shadow-lg">{meal.title}</h1>
              <p className="text-amber-400 font-bold text-xl">{meal.calories.toFixed(0)} kcal</p>
           </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
            {/* Description */}
            <section>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Descrição</h2>
                <p className="text-gray-300 leading-relaxed text-lg">{meal.description}</p>
            </section>

            {/* Macros Breakdown */}
            <section>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Distribuição de Macronutrientes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {meal.macros.map((macro, idx) => {
                         const pct = calculateMacroPercentage(macro.name, macro.amount, meal.calories);
                         return (
                            <div key={idx} className="bg-gray-700/50 p-4 rounded-xl border border-gray-700 relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 bg-amber-400/10" style={{width: `${pct}%`}}></div>
                                <div className="relative z-10">
                                    <span className="block text-sm text-gray-400 mb-1">{macro.name}</span>
                                    <span className="text-2xl font-bold text-white">{macro.amount}<span className="text-sm text-gray-400 font-normal">{macro.unit}</span></span>
                                    <span className="block text-xs text-amber-400 mt-1">{pct}% das calorias</span>
                                </div>
                            </div>
                         );
                    })}
                </div>
            </section>

            {/* Ingredients List */}
            {meal.ingredients && meal.ingredients.length > 0 && (
                <section className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Ingredientes Detalhados</h2>
                    <ul className="space-y-3">
                        {meal.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center justify-between border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-200 font-medium">{ing.name}</span>
                                <div className="text-right">
                                    <span className="block text-amber-400 font-mono">{ing.amount} {ing.unit}</span>
                                    {ing.percentage && <span className="text-xs text-gray-500">aprox. {ing.percentage}% do prato</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            
             {/* Micros */}
             {meal.micros.length > 0 && (
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Micronutrientes</h2>
                    <div className="flex flex-wrap gap-2">
                        {meal.micros.map((micro, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 border border-gray-600">
                                {micro.name}: {micro.amount}{micro.unit}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <div className="pt-8 border-t border-gray-700 text-center">
                <p className="text-gray-500 text-sm">Análise gerada por MY NUTRI.IA</p>
                <p className="text-gray-600 text-xs mt-1">{meal.timestamp}</p>
            </div>
        </div>
      </div>
    </div>
  );
};