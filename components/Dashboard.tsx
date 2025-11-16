import React from 'react';
import ProgressBar from './ProgressBar';
import { BarChart2, TrendingUp, Target } from 'lucide-react';

interface PerformanceData {
  overallAverage: number;
  subjectAverages: { name: string; average: number; }[];
  overallProgress: number;
}

const Dashboard: React.FC<{ performanceData: PerformanceData }> = ({ performanceData }) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 mb-8">
        <h2 className="flex items-center text-2xl font-bold text-slate-100 mb-6">
            <BarChart2 className="h-7 w-7 mr-3 text-indigo-400" />
            Dashboard de Desempenho
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
                <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 h-full flex flex-col justify-center">
                    <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center"><TrendingUp size={16} className="mr-2" /> Média Geral dos Simulados</h3>
                    <p className="text-3xl font-bold text-indigo-400">{performanceData.overallAverage.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center"><Target size={16} className="mr-2" /> Progresso nos Estudos</h3>
                    <ProgressBar progress={performanceData.overallProgress} />
                     <p className="text-right text-xs text-slate-400 mt-1">{performanceData.overallProgress.toFixed(0)}% concluído</p>
                </div>
            </div>
            
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Desempenho por Disciplina</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {performanceData.subjectAverages.length > 0 ? (
                        performanceData.subjectAverages.sort((a,b) => b.average - a.average).map(({ name, average }) => (
                            <div key={name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-slate-300 truncate pr-2">{name}</span>
                                    <span className="text-sm font-semibold text-indigo-400 flex-shrink-0">{average.toFixed(1)}%</span>
                                </div>
                                <ProgressBar progress={average} />
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhuma nota de simulado adicionada ainda.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
