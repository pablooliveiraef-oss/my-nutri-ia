
import React, { useState, useEffect } from 'react';
import type { DailyGoals } from '../types';
import { SettingsIcon, ChevronDownIcon } from './icons';

interface GoalSetterProps {
  goals: DailyGoals;
  onGoalsChange: (newGoals: DailyGoals) => void;
}

export const GoalSetter: React.FC<GoalSetterProps> = ({ goals, onGoalsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localGoals, setLocalGoals] = useState<DailyGoals>(goals);

  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalGoals(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleSaveChanges = () => {
    onGoalsChange(localGoals);
    setIsOpen(false);
  };

  const baseInputClasses = "w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white text-center focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none";

  return (
    <div className="w-full max-w-2xl bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm mb-8 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 font-semibold text-lg text-amber-300"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6" />
          <span>Metas Diárias</span>
        </div>
        <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <div>
                    <label htmlFor="calories" className="block text-sm font-medium text-gray-400 mb-1 text-center">Ingestão (kcal)</label>
                    <input type="number" id="calories" name="calories" value={localGoals.calories} onChange={handleInputChange} className={baseInputClasses} placeholder="2000"/>
                </div>
                 <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-400 mb-1 text-center">Proteínas (g)</label>
                    <input type="number" id="protein" name="protein" value={localGoals.protein} onChange={handleInputChange} className={baseInputClasses} placeholder="120"/>
                </div>
                 <div>
                    <label htmlFor="carbs" className="block text-sm font-medium text-gray-400 mb-1 text-center">Carboidratos (g)</label>
                    <input type="number" id="carbs" name="carbs" value={localGoals.carbs} onChange={handleInputChange} className={baseInputClasses} placeholder="250"/>
                </div>
                 <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-400 mb-1 text-center">Gorduras (g)</label>
                    <input type="number" id="fat" name="fat" value={localGoals.fat} onChange={handleInputChange} className={baseInputClasses} placeholder="60"/>
                </div>
                <div>
                    <label htmlFor="burnedCalories" className="block text-sm font-medium text-orange-400 mb-1 text-center">Meta Gasto (kcal)</label>
                    <input type="number" id="burnedCalories" name="burnedCalories" value={localGoals.burnedCalories || 0} onChange={handleInputChange} className={`${baseInputClasses} border-orange-500/50 focus:ring-orange-500`} placeholder="500"/>
                </div>
            </div>
            <button
                onClick={handleSaveChanges}
                className="w-full bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors duration-300"
            >
                Salvar Metas
            </button>
        </div>
      )}
    </div>
  );
};