
import { GoogleGenAI, Type } from "@google/genai";
import type { MealAnalysis } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("A variável de ambiente API_KEY não está definida");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "Um título cativante e descritivo para a refeição em Português."
        },
        description: {
            type: Type.STRING,
            description: "Um resumo curto de uma ou duas frases sobre a refeição e seus componentes principais em Português."
        },
        ingredients: {
            type: Type.ARRAY,
            description: "Lista detalhada dos alimentos/ingredientes identificados na imagem.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Nome do alimento (ex: Arroz Branco, Peito de Frango)." },
                    amount: { type: Type.NUMBER, description: "Quantidade estimada." },
                    unit: { type: Type.STRING, description: "Unidade de medida (ex: g, ml, unidade, fatia)." },
                    percentage: { type: Type.NUMBER, description: "Porcentagem aproximada que este alimento representa no prato (0-100)." }
                },
                required: ["name", "amount", "unit"]
            }
        },
        calories: {
            type: Type.NUMBER,
            description: "Total de calorias estimadas para o prato inteiro."
        },
        macros: {
            type: Type.ARRAY,
            description: "Uma lista de macronutrientes com nomes em Português.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "ex: 'Proteína', 'Carboidratos', 'Gorduras'" },
                    amount: { type: Type.NUMBER, description: "Quantidade em gramas." },
                    unit: { type: Type.STRING, description: "ex: 'g'" }
                },
                 required: ["name", "amount", "unit"]
            }
        },
        micros: {
            type: Type.ARRAY,
            description: "Uma lista de micronutrientes principais com nomes em Português.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "ex: 'Vitamina C', 'Ferro', 'Sódio'" },
                    amount: { type: Type.NUMBER, description: "Quantidade em miligramas (mg) ou microgramas (mcg)." },
                    unit: { type: Type.STRING, description: "ex: 'mg', 'mcg'" }
                },
                required: ["name", "amount", "unit"]
            }
        }
    },
    required: ["title", "description", "ingredients", "calories", "macros", "micros"]
};


export const analyzeFoodImage = async (base64Image: string, mimeType: string): Promise<MealAnalysis> => {
    const prompt = `
        Analise os alimentos nesta imagem.
        Identifique os componentes da refeição e estime os tamanhos das porções.

        CRITÉRIO DE DADOS (IMPORTANTE):
        Para o cálculo nutricional (calorias, macronutrientes e micronutrientes), utilize EXCLUSIVAMENTE e OBRIGATORIAMENTE os dados da **Tabela Brasileira de Composição de Alimentos (TACO - NEPA/UNICAMP)** como referência primária. 
        Ajuste os valores proporcionais à quantidade estimada na imagem.

        Retorne o resultado como um objeto JSON que siga estritamente o esquema fornecido.
        Não inclua formatação markdown como \`\`\`json.
        
        IMPORTANTE: 
        1. O 'title' (título) e a 'description' (descrição) devem estar em Português do Brasil.
        2. Os nomes dos nutrientes (campo 'name') dentro de 'macros' e 'micros' devem estar em Português do Brasil (ex: Proteína, Carboidratos, Gorduras, Vitamina C, etc).
        3. Preencha o campo 'ingredients' com cada alimento identificado, sua quantidade estimada e a PORCENTAGEM aproximada que ele ocupa na refeição.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        return parsedData as MealAnalysis;

    } catch (error) {
        console.error("Erro ao analisar imagem com Gemini API:", error);
        throw new Error("Falha ao analisar a imagem da refeição. O modelo de IA não conseguiu processar a solicitação.");
    }
};

export const getActivityMET = async (activityName: string, intensity: string): Promise<number> => {
    const prompt = `
        Identifique o valor MET (Metabolic Equivalent of Task) para a seguinte atividade física: "${activityName}" realizada com intensidade "${intensity}".
        
        Utilize como referência o "Compendium of Physical Activities".
        Seja preciso. Se não encontrar a atividade exata, use a mais próxima possível.
        
        Retorne APENAS um objeto JSON no seguinte formato:
        {
            "met": number
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        met: { type: Type.NUMBER, description: "O valor MET da atividade." }
                    },
                    required: ["met"]
                }
            }
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        return parsedData.met;
    } catch (error) {
        console.error("Erro ao buscar MET:", error);
        return 1.0; // Fallback para repouso
    }
};
