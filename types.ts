export interface EditalData {
    titulo_concurso?: string;
    organizacao?: string;
    resumo?: string;
    taxa_inscricao?: number;
    cargos?: {
        nome_cargo?: string;
        vagas?: number | string;
        salario?: number;
        requisitos?: string[];
        jornada_trabalho?: string;
    }[];
    cronograma?: {
        evento?: string;
        data?: string;
    }[];
    conteudo_programatico?: {
        disciplina?: string;
        topicos?: string[];
    }[];
}

export interface User {
  email: string;
}

export interface StudyPlan {
    id: string;
    name: string;
    createdAt: number;
    editalData: EditalData;
    checkedTopics: Record<string, boolean>;
    mockScores: Record<string, number[]>;
    subTopics: Record<string, any[]>;
    disciplineLinks: Record<string, any[]>;
    topicLinks: Record<string, any[]>;
}

export interface UserProfile {
    user: User;
    plans: Record<string, StudyPlan>; // Keyed by planId
    activePlanId: string | null;
}
