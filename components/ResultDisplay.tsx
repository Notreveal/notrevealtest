
import React from 'react';
import type { EditalData } from '../types.ts';
import { BookOpen, Calendar, Briefcase, ChevronRight } from 'lucide-react';

interface ResultDisplayProps {
  data: EditalData | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const {
        titulo_concurso,
        organizacao,
        resumo,
        cargos,
        cronograma,
        conteudo_programatico,
    } = data;

    return (
        <div className="space-y-8">
            {/* Main Info */}
            <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700">
                <h2 className="text-2xl font-bold text-indigo-400 mb-2">{titulo_concurso || 'Detalhes do Concurso'}</h2>
                <p className="text-lg text-slate-300 mb-4 font-medium">{organizacao || 'Organização não informada'}</p>
                <p className="text-slate-400">{resumo || 'Nenhum resumo disponível.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cargos */}
                {cargos && cargos.length > 0 && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <h3 className="flex items-center text-xl font-bold text-slate-100 mb-4">
                            <Briefcase className="h-6 w-6 mr-3 text-indigo-400" />
                            Cargos Disponíveis
                        </h3>
                        <ul className="space-y-4">
                            {cargos.map((cargo, index) => (
                                <li key={index} className="p-4 bg-slate-900/70 rounded-lg border border-slate-700">
                                    <p className="font-semibold text-indigo-400">{cargo.nome_cargo}</p>
                                    <p className="text-sm text-slate-400">Vagas: {cargo.vagas ?? 'N/A'} | Salário: R$ {cargo.salario?.toFixed(2) ?? 'N/A'}</p>
                                    <p className="text-sm text-slate-400">Requisitos: {cargo.requisitos?.join(', ') ?? 'N/A'}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Cronograma */}
                {cronograma && cronograma.length > 0 && (
                     <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <h3 className="flex items-center text-xl font-bold text-slate-100 mb-4">
                            <Calendar className="h-6 w-6 mr-3 text-indigo-400" />
                            Cronograma
                        </h3>
                        <ul className="space-y-2">
                           {cronograma.map((item, index) => (
                               <li key={index} className="flex justify-between items-center p-2 rounded-md bg-slate-900/70">
                                   <span className="text-slate-300">{item.evento}</span>
                                   <span className="font-mono text-amber-400 text-sm bg-slate-800 px-2 py-1 rounded">{item.data}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Conteúdo Programático */}
            {conteudo_programatico && conteudo_programatico.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700">
                    <h3 className="flex items-center text-xl font-bold text-slate-100 mb-6">
                        <BookOpen className="h-6 w-6 mr-3 text-indigo-400" />
                        Conteúdo Programático
                    </h3>
                    <div className="space-y-6">
                        {conteudo_programatico.map((disciplina, index) => (
                            <div key={index}>
                                <h4 className="text-lg font-semibold text-indigo-400 border-b border-slate-700 pb-2 mb-3">{disciplina.disciplina}</h4>
                                <ul className="space-y-2 list-none p-0">
                                    {disciplina.topicos?.map((topico, i) => (
                                        <li key={i} className="flex items-start text-slate-300 py-1">
                                            <ChevronRight className="h-4 w-4 mr-2 mt-1 text-indigo-500 flex-shrink-0" />
                                            <span>{topico}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultDisplay;