
import { jsPDF } from "jspdf";
import type { MealLog, DailyGoals, ActivityLog } from '../types';

export const generateDailyPDF = (meals: MealLog[], goals: DailyGoals, activities: ActivityLog[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // --- Helpers ---
    const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        if (align === 'center') {
            doc.text(text, pageWidth / 2, yPos, { align: 'center' });
        } else if (align === 'right') {
            doc.text(text, pageWidth - margin, yPos, { align: 'right' });
        } else {
            doc.text(text, margin, yPos);
        }
        yPos += fontSize * 0.5; // Line height
    };

    const addLine = (thickness: number = 0.5) => {
        doc.setLineWidth(thickness);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
    };

    const checkPageBreak = (neededSpace: number) => {
        if (yPos + neededSpace > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = 20;
        }
    };

    // --- 1. Header ---
    addText("MY NUTRI.IA - Relatório Diário", 22, true, 'center');
    yPos += 5;
    addText(`Data: ${new Date().toLocaleDateString()}`, 12, false, 'center');
    yPos += 10;
    addLine();

    // --- 2. Daily Summary ---
    const totals = meals.reduce((acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.macros.find(m => m.name.toLowerCase().includes('prote'))?.amount || 0;
        acc.carbs += meal.macros.find(m => m.name.toLowerCase().includes('carbo'))?.amount || 0;
        acc.fat += meal.macros.find(m => m.name.toLowerCase().includes('gord'))?.amount || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const totalBurned = activities.reduce((acc, act) => acc + act.caloriesBurned, 0);
    const netCalories = totals.calories - totalBurned;

    addText("Resumo do Dia", 16, true);
    yPos += 5;

    // Nutrition Data
    const summaryData = [
        { label: "Calorias Ingeridas", value: totals.calories, goal: goals.calories, unit: "kcal" },
        { label: "Proteínas", value: totals.protein, goal: goals.protein, unit: "g" },
        { label: "Carboidratos", value: totals.carbs, goal: goals.carbs, unit: "g" },
        { label: "Gorduras", value: totals.fat, goal: goals.fat, unit: "g" },
    ];

    summaryData.forEach(item => {
        const pct = item.goal > 0 ? Math.round((item.value / item.goal) * 100) : 0;
        const lineText = `${item.label}: ${item.value.toFixed(0)} / ${item.goal} ${item.unit}  (${pct}%)`;
        addText(lineText, 12);
        yPos += 2; 
    });

    // Activity Data
    yPos += 3;
    const burnedPct = goals.burnedCalories > 0 ? Math.round((totalBurned / goals.burnedCalories) * 100) : 0;
    addText(`Calorias Queimadas: ${totalBurned} / ${goals.burnedCalories || 0} kcal (${burnedPct}%)`, 12, false);
    yPos += 2;
    
    // Net Balance
    yPos += 3;
    doc.setTextColor(netCalories > 0 ? 0 : 200, netCalories > 0 ? 100 : 0, 0); // Greenish if positive, Reddish if negative (simplified logic)
    addText(`Saldo Calórico Final: ${netCalories.toFixed(0)} kcal`, 12, true);
    doc.setTextColor(0, 0, 0); // Reset color

    yPos += 5;
    addLine();

    // --- 3. Activities Detail ---
    if (activities.length > 0) {
        checkPageBreak(40);
        addText("Atividades Realizadas", 16, true);
        yPos += 5;
        activities.forEach(act => {
            checkPageBreak(10);
            addText(`- ${act.name} (${act.intensity}): ${act.durationMinutes} min | ${act.caloriesBurned} kcal (MET: ${act.metValue})`, 10);
            yPos += 2;
        });
        yPos += 5;
        addLine();
    }

    // --- 4. Meals Detail ---
    addText("Refeições Detalhadas", 16, true);
    yPos += 10;

    meals.forEach((meal, index) => {
        // Check space for header + image + basics (approx 100 units)
        checkPageBreak(80);

        // Meal Title and Time
        addText(`${index + 1}. ${meal.title}`, 14, true);
        yPos += 2;
        addText(`${meal.timestamp} - ${meal.calories.toFixed(0)} kcal`, 10, false);
        yPos += 5;

        // Image
        try {
            // Keep image aspect ratio roughly, limiting width
            const imgWidth = 60;
            const imgHeight = 45; // approximate
            doc.addImage(meal.imageSrc, 'JPEG', margin, yPos, imgWidth, imgHeight);
            
            // Macros Position (Right of image)
            let macroY = yPos + 5;
            const textX = margin + imgWidth + 10;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Macronutrientes:", textX, macroY);
            macroY += 5;
            doc.setFont("helvetica", "normal");
            
            meal.macros.forEach(m => {
                doc.text(`- ${m.name}: ${m.amount.toFixed(1)}${m.unit}`, textX, macroY);
                macroY += 5;
            });

            yPos += imgHeight + 5;

        } catch (e) {
            // Fallback if image fails
            addText("(Imagem indisponível para o PDF)", 10);
            yPos += 5;
        }

        // Ingredients List
        checkPageBreak(30); // Check if ingredients fit
        addText("Ingredientes:", 10, true);
        yPos += 3;
        
        if (meal.ingredients) {
            meal.ingredients.forEach(ing => {
                checkPageBreak(10);
                let ingText = `- ${ing.name}: ${ing.amount}${ing.unit}`;
                if (ing.percentage) ingText += ` (${ing.percentage}%)`;
                addText(ingText, 9);
                yPos += 1;
            });
        }
        
        yPos += 10;
        addLine(0.1); // Light separator
        yPos += 10;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Relatorio_MyNutriIA_${new Date().toISOString().split('T')[0]}.pdf`);
};
