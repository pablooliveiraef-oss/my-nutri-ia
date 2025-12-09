
import React, { useState } from 'react';
import type { UserProfile, ActivityLog } from '../types';
import { FireIcon, RunIcon, ChevronDownIcon, DeleteIcon } from './icons';
import { getActivityMET } from '../services/geminiService';

interface ActivityTrackerProps {
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    activities: ActivityLog[];
    onAddActivity: (activity: ActivityLog) => void;
    onDeleteActivity: (id: string) => void;
    className?: string;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ 
    userProfile, 
    onUpdateProfile, 
    activities, 
    onAddActivity,
    onDeleteActivity,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form States
    const [activityName, setActivityName] = useState('');
    const [duration, setDuration] = useState('');
    const [intensity, setIntensity] = useState<'Leve' | 'Moderado' | 'Vigoroso'>('Moderado');

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdateProfile({
            ...userProfile,
            [name]: Number(value)
        });
    };

    const handleCalculate = async () => {
        if (!userProfile.weight || !activityName || !duration) {
            alert("Por favor, preencha o peso, nome da atividade e tempo.");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Get MET from Gemini
            const met = await getActivityMET(activityName, intensity);
            
            // 2. Calculate Calories: Kcal = MET * Weight(kg) * Duration(hours)
            const durationInHours = Number(duration) / 60;
            const caloriesBurned = Math.round(met * userProfile.weight * durationInHours);

            // 3. Create Log Object
            const newActivity: ActivityLog = {
                id: Date.now().toString(),
                name: activityName,
                durationMinutes: Number(duration),
                intensity,
                metValue: met,
                caloriesBurned,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            onAddActivity(newActivity);
            setActivityName('');
            setDuration('');

        } catch (error) {
            console.error(error);
            alert("Erro ao calcular atividade. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const baseInputClasses = "w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none";

    return (
        <div className={`w-full bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 overflow-hidden ${className}`}>
             
             {/* Header Image for Activities (Red/Orange Theme) */}
             <div className="relative h-48 w-full group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <img 
                    src="https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop" 
                    alt="Mulher realizando musculação" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-orange-800/60 flex flex-col justify-center px-6">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-full shadow-lg text-white">
                                <FireIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white shadow-black drop-shadow-md">Registro de Atividades</h2>
                                <p className="text-sm text-orange-200">Gasto Calórico e Exercícios</p>
                            </div>
                        </div>
                        <ChevronDownIcon className={`w-8 h-8 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
             </div>

            {isOpen && (
                <div className="p-6">
                    {/* User Profile Section */}
                    <div className="mb-4 p-3 bg-gray-900/40 rounded-lg border border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Seus Dados (Base para cálculo)</h3>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Peso (kg)</label>
                                <input 
                                    type="number" 
                                    name="weight" 
                                    value={userProfile.weight || ''} 
                                    onChange={handleProfileChange} 
                                    className={baseInputClasses}
                                    placeholder="Ex: 70"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Estatura (cm)</label>
                                <input 
                                    type="number" 
                                    name="height" 
                                    value={userProfile.height || ''} 
                                    onChange={handleProfileChange} 
                                    className={baseInputClasses}
                                    placeholder="Ex: 175"
                                />
                            </div>
                        </div>
                    </div>

                    {/* New Activity Input */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                        <div className="md:col-span-2">
                             <label className="block text-xs text-gray-400 mb-1">Atividade</label>
                             <input 
                                type="text" 
                                value={activityName}
                                onChange={(e) => setActivityName(e.target.value)}
                                className={baseInputClasses}
                                placeholder="Ex: Musculação, Corrida"
                             />
                        </div>
                        <div>
                             <label className="block text-xs text-gray-400 mb-1">Tempo (min)</label>
                             <input 
                                type="number" 
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className={baseInputClasses}
                                placeholder="30"
                             />
                        </div>
                        <div>
                             <label className="block text-xs text-gray-400 mb-1">Esforço</label>
                             <select 
                                value={intensity}
                                onChange={(e) => setIntensity(e.target.value as any)}
                                className={baseInputClasses}
                             >
                                <option value="Leve">Leve</option>
                                <option value="Moderado">Moderado</option>
                                <option value="Vigoroso">Vigoroso</option>
                             </select>
                        </div>
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={isLoading}
                        className={`w-full py-2 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-orange-500/20'
                        }`}
                    >
                        {isLoading ? (
                            <>Calculando METs...</>
                        ) : (
                            <>
                                <RunIcon className="w-5 h-5" />
                                <span>Adicionar Atividade</span>
                            </>
                        )}
                    </button>

                    {/* Activity List */}
                    {activities.length > 0 && (
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold text-gray-300 mb-3">Atividades de Hoje</h3>
                            <div className="space-y-2">
                                {activities.map(act => (
                                    <div key={act.id} className="flex items-center justify-between bg-gray-700/30 p-2 rounded border border-gray-700">
                                        <div>
                                            <p className="text-white font-medium text-sm">{act.name} <span className="text-xs text-gray-500">({act.intensity})</span></p>
                                            <p className="text-xs text-gray-400">{act.durationMinutes} min • MET {act.metValue}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-orange-400 font-bold">-{act.caloriesBurned} kcal</span>
                                            <button onClick={() => onDeleteActivity(act.id)} className="text-gray-500 hover:text-red-400">
                                                <DeleteIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
