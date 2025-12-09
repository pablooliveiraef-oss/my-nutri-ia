
import React, { useMemo } from 'react';
import type { MealLog, DailyGoals, ActivityLog } from '../types';

interface DailySummaryProps {
  meals: MealLog[];
  goals: DailyGoals;
  activities?: ActivityLog[];
}

interface Totals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    burned: number;
}

const ProgressTracker: React.FC<{ label: string; current: number; goal: number; unit: string; color?: string }> = ({ label, current, goal, unit, color }) => {
    const percentage = goal > 0 ? (current / goal) * 100 : 0;
    const isOver = percentage > 100;
    const barColor = color ? color : (isOver ? 'bg-red-500' : 'bg-amber-400');
    const displayPercentage = percentage.toFixed(0);
    
    return (
        <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wide truncate pr-1">{label}</span>
                <span className={`text-xs font-bold ${color ? 'text-orange-400' : (isOver ? 'text-red-400' : 'text-amber-400')}`}>
                    {displayPercentage}%
                </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2 mb-1.5 overflow-hidden">
                <div
                    className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
            <div className="text-right">
                <span className="text-[10px] text-gray-400">
                     {current.toFixed(unit === 'g' ? 1 : 0)} <span className="text-gray-600">/</span> {goal > 0 ? goal.toFixed(0) : '-'} {unit}
                </span>
            </div>
        </div>
    );
};

export const DailySummary: React.FC<DailySummaryProps> = ({ meals, goals, activities = [] }) => {
    const totals = useMemo<Totals>(() => {
        const foodTotals = meals.reduce((acc, meal) => {
            acc.calories += meal.calories;
            acc.protein += meal.macros.find(m => m.name.toLowerCase().includes('prote'))?.amount || 0;
            acc.carbs += meal.macros.find(m => m.name.toLowerCase().includes('carbo'))?.amount || 0;
            acc.fat += meal.macros.find(m => m.name.toLowerCase().includes('gord'))?.amount || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const burned = activities.reduce((acc, act) => acc + act.caloriesBurned, 0);

        return { ...foodTotals, burned };
    }, [meals, activities]);

    const netCalories = totals.calories - totals.burned;

    return (
        <div className="sticky bottom-0 left-0 right-0 w-full p-4 bg-black/60 backdrop-blur-lg border-t border-amber-400/30 shadow-2xl z-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h2 className="text-lg font-bold text-amber-300">Progresso Diário</h2>
                    <div className="text-xs text-gray-400 flex gap-3">
                        <span>Ingerido: <strong className="text-white">{totals.calories.toFixed(0)}</strong></span>
                        <span>-</span>
                        <span>Queimado: <strong className="text-orange-400">{totals.burned}</strong></span>
                        <span>=</span>
                        <span className="text-amber-400 font-bold border border-amber-400/30 px-2 rounded">Saldo: {netCalories.toFixed(0)}</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                   {/* Atividade movida para a primeira posição */}
                   <ProgressTracker label="Atividade" current={totals.burned} goal={goals.burnedCalories || 500} unit="kcal" color="bg-orange-500" />
                   <ProgressTracker label="Calorias (Liq)" current={netCalories} goal={goals.calories} unit="kcal" />
                   <ProgressTracker label="Proteínas" current={totals.protein} goal={goals.protein} unit="g" />
                   <ProgressTracker label="Carbos" current={totals.carbs} goal={goals.carbs} unit="g" />
                   <ProgressTracker label="Gorduras" current={totals.fat} goal={goals.fat} unit="g" />
                </div>
            </div>
        </div>
    );
};