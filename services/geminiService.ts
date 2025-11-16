import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface FilePart {
    inlineData: { data: string; mimeType: string; };
}

const extractionPrompt = `
**System Instruction:**
Você é um especialista em análise de editais de concursos públicos no Brasil. Sua tarefa é extrair informações estruturadas de um texto, imagem ou PDF de um edital fornecido pelo usuário. A saída deve ser um JSON bem-formado, contido dentro de um bloco de código Markdown.

**JSON Schema de Saída Esperado:**
O JSON deve seguir este esquema:
{
  "titulo_concurso": "string",
  "organizacao": "string",
  "resumo": "string",
  "cargos": [
    {
      "nome_cargo": "string",
      "vagas": "number | string",
      "salario": "number",
      "requisitos": ["string"],
      "jornada_trabalho": "string"
    }
  ],
  "cronograma": [
    {
      "evento": "string",
      "data": "string"
    }
  ],
  "taxa_inscricao": "number",
  "conteudo_programatico": [
     {
       "disciplina": "string",
       "topicos": ["string"]
     }
  ]
}

**Tarefa:**
Analise o conteúdo do edital fornecido a seguir e extraia as informações conforme o JSON Schema. Se alguma informação não for encontrada, omita o campo ou preencha com um valor nulo ou vazio.
**Importante:** Dentro de 'conteudo_programatico', para cada 'disciplina', liste cada tópico ou assunto individualmente no array 'topicos'. Não agrupe múltiplos assuntos em uma única string.
Retorne APENAS o resultado em um único bloco de código markdown contendo o JSON.

**Exemplo de Saída:**
\`\`\`json
{
  "titulo_concurso": "Concurso Público para a Prefeitura de Exemplo",
  "organizacao": "Fundação Concursos & Cia",
  "resumo": "Abre vagas para os níveis médio e superior em diversas áreas da administração municipal.",
  "cargos": [
    {
      "nome_cargo": "Analista Administrativo",
      "vagas": 5,
      "salario": 4500.00,
      "requisitos": ["Nível Superior em Administração"],
      "jornada_trabalho": "40 horas semanais"
    }
  ],
  "cronograma": [
    {
      "evento": "Período de Inscrição",
      "data": "01/10/2024 a 30/10/2024"
    },
    {
      "evento": "Data da Prova Objetiva",
      "data": "15/12/2024"
    }
  ],
  "taxa_inscricao": 95.50,
  "conteudo_programatico": [
     {
       "disciplina": "Língua Portuguesa",
       "topicos": [
         "Interpretação de textos",
         "Gramática",
         "Concordância verbal e nominal",
         "Crase"
        ]
     },
     {
       "disciplina": "Raciocínio Lógico",
       "topicos": [
         "Estruturas lógicas",
         "Lógica de argumentação",
         "Diagramas lógicos"
       ]
     }
  ]
}
\`\`\`
`;


export const verticalizeEdital = async (userInput: string | FilePart, cargo: string, signal: AbortSignal): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash'; // Multimodal model
        
        const focusPrompt = cargo.trim() 
            ? `\n**Foco de Análise Específico:**\nO usuário informou interesse no cargo de "${cargo}". Dê atenção especial a este cargo e, se houver conteúdo programático específico para ele, priorize-o. Se o conteúdo for geral, extraia-o normalmente. Se houver múltiplos conteúdos para cargos diferentes, extraia APENAS o do cargo solicitado.`
            : '';

        const parts = [
            { text: extractionPrompt + focusPrompt },
            typeof userInput === 'string' 
                ? { text: `\n\n**CONTEÚDO DO EDITAL PARA ANÁLISE:**\n\n${userInput}` } 
                : userInput,
        ];

        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts }],
            signal: signal,
        });

        const text = response.text;
        if (text) {
            return text;
        } else {
            throw new Error("A IA retornou uma resposta vazia. Tente novamente com um conteúdo diferente.");
        }
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
             throw error;
        }
        console.error("Error calling Gemini API:", error);
        throw new Error("Falha ao processar o edital. Verifique sua chave de API e conexão com a internet.");
    }
};
