import React, { useState } from 'react';
import type { MealLog, Nutrient, Ingredient } from '../types';
import { DeleteIcon, ShareIcon, EditIcon } from './icons';

interface ResultCardProps {
  meal: MealLog;
  onDelete: (id: string) => void;
  onUpdate: (updatedMeal: MealLog) => void;
}

// Helper to calculate macro percentage contribution to total calories
const calculateMacroPercentage = (macroName: string, grams: number, totalCalories: number): number => {
    if (!totalCalories || totalCalories === 0) return 0;
    
    const lowerName = macroName.toLowerCase();
    let caloriesPerGram = 4; // Default for Protein/Carbs

    if (lowerName.includes('gord') || lowerName.includes('fat') || lowerName.includes('lipid')) {
        caloriesPerGram = 9;
    } else if (lowerName.includes('alco')) {
        caloriesPerGram = 7;
    }

    const macroCalories = grams * caloriesPerGram;
    return Math.round((macroCalories / totalCalories) * 100);
};

const NutrientPill: React.FC<{ nutrient: { name: string; amount: number; unit: string; }, color: string, totalCalories: number }> = ({ nutrient, color, totalCalories }) => {
    const percentage = calculateMacroPercentage(nutrient.name, nutrient.amount, totalCalories);
    
    return (
        <div className={`flex justify-between items-center px-3 py-2 rounded-lg bg-opacity-20 ${color} relative overflow-hidden`}>
             {/* Background bar for visualization */}
             <div className={`absolute left-0 top-0 bottom-0 bg-current opacity-10`} style={{ width: `${percentage}%` }}></div>
             
             <div className="flex flex-col relative z-10">
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">{nutrient.name}</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{nutrient.amount.toFixed(1)}{nutrient.unit}</span>
                    <span className="text-xs font-mono text-gray-400">({percentage}%)</span>
                </div>
             </div>
        </div>
    );
};

export const ResultCard: React.FC<ResultCardProps> = ({ meal, onDelete, onUpdate }) => {
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeal, setEditedMeal] = useState<MealLog>(meal);

  const handleShare = async () => {
    // Matching partial Portuguese strings: 'prote' (Proteína), 'carbo' (Carboidratos), 'gord' (Gorduras)
    const getMacro = (name: string) => meal.macros.find(m => m.name.toLowerCase().includes(name))?.amount.toFixed(1) || 'N/A';
    const ingredientsText = meal.ingredients?.map(i => `- ${i.name}: ${i.amount}${i.unit} (${i.percentage ? i.percentage + '%' : ''})`).join('\n') || '';
    
    // Generate Link
    const currentUrl = window.location.origin + window.location.pathname;
    const shareLink = `${currentUrl}?mealId=${meal.id}`;

    const summaryText = `Veja minha refeição analisada pela MY NUTRI.IA:\n\n` +
                        `Refeição: ${meal.title}\n` +
                        `Descrição: ${meal.description}\n\n`+
                        `Ingredientes:\n${ingredientsText}\n\n` +
                        `Calorias: ${meal.calories.toFixed(0)} kcal\n` +
                        `Proteínas: ${getMacro('prote')}g\n` +
                        `Carboidratos: ${getMacro('carbo')}g\n` +
                        `Gorduras: ${getMacro('gord')}g\n\n` +
                        `Ver detalhes completos: ${shareLink}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Minha Refeição: ${meal.title}`,
                text: summaryText,
                url: shareLink
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        try {
            await navigator.clipboard.writeText(summaryText);
            setCopyStatus('Link Copiado!');
            setTimeout(() => setCopyStatus(''), 2000); // Reset after 2 seconds
        } catch (error) {
            console.error('Failed to copy:', error);
            setCopyStatus('Falhou!');
            setTimeout(() => setCopyStatus(''), 2000);
        }
    }
  };

  const handleSave = () => {
      onUpdate(editedMeal);
      setIsEditing(false);
  };

  const handleCancel = () => {
      setEditedMeal(meal);
      setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditedMeal(prev => ({
          ...prev,
          [name]: name === 'calories' ? Number(value) : value
      }));
  };

  const handleMacroChange = (index: number, newValue: string) => {
      const updatedMacros = [...editedMeal.macros];
      updatedMacros[index] = { ...updatedMacros[index], amount: Number(newValue) };
      setEditedMeal(prev => ({ ...prev, macros: updatedMacros }));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
      const updatedIngredients = [...(editedMeal.ingredients || [])];
      updatedIngredients[index] = { 
          ...updatedIngredients[index], 
          [field]: (field === 'amount' || field === 'percentage') ? Number(value) : value 
      };
      setEditedMeal(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const handleDeleteIngredient = (index: number) => {
      const updatedIngredients = (editedMeal.ingredients || []).filter((_, i) => i !== index);
      setEditedMeal(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const handleAddIngredient = () => {
      setEditedMeal(prev => ({
          ...prev,
          ingredients: [...(prev.ingredients || []), { name: 'Novo Alimento', amount: 100, unit: 'g', percentage: 0 }]
      }));
  };

  return (
    <div className="relative w-full max-w-2xl bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-4 transition-all duration-300 hover:border-amber-400/50">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1">
          <img src={meal.imageSrc} alt={meal.title} className="w-full h-48 md:h-full object-cover" />
        </div>
        <div className="md:col-span-2 p-6">
          
          {isEditing ? (
              // EDIT MODE
              <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título</label>
                    <input 
                        type="text" 
                        name="title" 
                        value={editedMeal.title} 
                        onChange={handleInputChange} 
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                    <textarea 
                        name="description" 
                        value={editedMeal.description} 
                        onChange={handleInputChange} 
                        rows={2}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                   {/* Ingredients Edit Section */}
                   <div>
                       <h3 className="text-xs font-semibold text-gray-400 mb-2">Ingredientes (Qtd | Un | % do Prato)</h3>
                       <div className="space-y-2 mb-2">
                           {(editedMeal.ingredients || []).map((ing, idx) => (
                               <div key={idx} className="flex gap-2 items-center">
                                   <input 
                                        type="text" 
                                        value={ing.name} 
                                        onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                                        placeholder="Nome"
                                   />
                                   <input 
                                        type="number" 
                                        value={ing.amount} 
                                        onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                                        className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400 text-center"
                                        placeholder="Qtd"
                                   />
                                   <input 
                                        type="text" 
                                        value={ing.unit} 
                                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                        className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400 text-center"
                                        placeholder="Un"
                                   />
                                   <input 
                                        type="number" 
                                        value={ing.percentage || 0} 
                                        onChange={(e) => handleIngredientChange(idx, 'percentage', e.target.value)}
                                        className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-amber-400 focus:outline-none focus:border-amber-400 text-center"
                                        placeholder="%"
                                        title="Porcentagem do prato"
                                   />
                                   <button onClick={() => handleDeleteIngredient(idx)} className="text-red-400 hover:text-red-300">
                                       <DeleteIcon className="w-4 h-4" />
                                   </button>
                               </div>
                           ))}
                       </div>
                       <button onClick={handleAddIngredient} className="text-xs text-amber-400 hover:text-amber-300 font-medium">+ Adicionar Ingrediente</button>
                   </div>

                   <div className="flex gap-4 mt-2 border-t border-gray-700 pt-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Calorias Totais</label>
                        <input 
                            type="number" 
                            name="calories" 
                            value={editedMeal.calories} 
                            onChange={handleInputChange} 
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                   </div>
                   <div>
                       <h3 className="text-xs font-semibold text-gray-400 mb-2">Macronutrientes Totais</h3>
                       <div className="grid grid-cols-3 gap-2">
                           {editedMeal.macros.map((macro, idx) => (
                               <div key={idx}>
                                   <label className="block text-[10px] text-gray-400 mb-1 truncate">{macro.name} ({macro.unit})</label>
                                   <input 
                                        type="number" 
                                        value={macro.amount} 
                                        onChange={(e) => handleMacroChange(idx, e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                                   />
                               </div>
                           ))}
                       </div>
                   </div>
                   <div className="flex justify-end gap-2 mt-4">
                       <button onClick={handleCancel} className="px-3 py-1 text-sm rounded text-gray-300 hover:bg-gray-700">Cancelar</button>
                       <button onClick={handleSave} className="px-3 py-1 text-sm rounded bg-amber-500 text-gray-900 font-bold hover:bg-amber-400">Salvar</button>
                   </div>
              </div>
          ) : (
              // VIEW MODE
              <>
                <div className="flex justify-between items-start">
                    <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{meal.title}</h2>
                    <p className="text-sm text-gray-400 mt-1 mb-2 max-w-prose">{meal.description}</p>
                    
                    {/* Ingredients List View */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                        <div className="my-3 bg-gray-800/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-700/50 pb-1">
                                <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Alimentos</h4>
                                <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Qtd (%)</h4>
                            </div>
                            <ul className="text-sm space-y-1">
                                {meal.ingredients.map((ing, idx) => (
                                    <li key={idx} className="flex justify-between text-gray-300 border-b border-gray-700/30 last:border-0 pb-1 last:pb-0">
                                        <span>{ing.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-amber-400/80">{ing.amount}{ing.unit}</span>
                                            {ing.percentage !== undefined && (
                                                <span className="text-xs text-gray-500 bg-gray-900/50 px-1.5 py-0.5 rounded">
                                                    {ing.percentage}%
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="text-amber-400 text-4xl font-extrabold my-2">{meal.calories.toFixed(0)} <span className="text-lg font-semibold text-gray-300">Calorias</span></p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 hover:text-amber-400 hover:bg-gray-700 rounded-full transition-colors" title="Editar Refeição">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleShare} className="relative p-2 text-gray-500 hover:text-amber-400 hover:bg-gray-700 rounded-full transition-colors" title="Compartilhar Refeição">
                        <ShareIcon className="w-5 h-5" />
                        {copyStatus && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                                {copyStatus}
                            </span>
                        )}
                        </button>
                        <button onClick={() => onDelete(meal.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors" title="Excluir Refeição">
                        <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Macronutrientes (Distribuíção Calórica)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {meal.macros.map(macro => <NutrientPill key={macro.name} nutrient={macro} color="bg-sky-500" totalCalories={meal.calories} />)}
                    </div>
                </div>
                
                {meal.micros.length > 0 && (
                    <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Micronutrientes</h3>
                    <div className="flex flex-wrap gap-2">
                        {meal.micros.map(micro => (
                        <div key={micro.name} className="bg-gray-700 px-2 py-1 rounded-md text-xs text-gray-300">
                            {micro.name}: {micro.amount.toFixed(1)}{micro.unit}
                        </div>
                        ))}
                    </div>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
    </div>
  );
};