
import React, { useState, useEffect, useMemo } from 'react';
// FIX: The StudyPlan type should be imported from its source definition in `../types`.
import type { StudyPlan } from '../types.ts';
import ProgressBar from './ProgressBar.tsx';
import Dashboard from './Dashboard.tsx';
import { ChevronDown, BookOpen, Trash2, Plus, Check, Pencil, Link, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface SubTopic {
  id: string;
  text: string;
  completed: boolean;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

// --- PlanManager Component ---
const PlanManager: React.FC = () => {
    const { 
        isLoggedIn,
        studyPlans, 
        activePlanId, 
        setActivePlanId, 
        deleteStudyPlan, 
    } = useAuth();
    
    if (isLoggedIn) {
        // Don't render manager if user is logged in but has no plans yet
        if (studyPlans.length === 0) return null; 

        return (
            <div className="flex items-center gap-4 mb-6">
                <select 
                    value={activePlanId || ''} 
                    onChange={(e) => setActivePlanId(e.target.value)}
                    className="flex-grow bg-slate-900/70 text-slate-300 p-3 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-label="Selecionar plano de estudos"
                >
                    {studyPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                </select>
                <button 
                    onClick={() => activePlanId && deleteStudyPlan(activePlanId)}
                    disabled={studyPlans.length <= 1}
                    className="p-3 text-red-400 bg-red-900/50 border border-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Excluir plano de estudos atual"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        );
    }

    // Guest user view
    return (
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                 <p className="font-semibold text-slate-200">Você está como Convidado</p>
                 <p className="text-sm text-slate-400">Crie uma conta para salvar seu progresso na nuvem e gerenciar múltiplos planos de estudo.</p>
            </div>
        </div>
    );
};


// --- LinkManager Component ---
interface LinkManagerProps {
  title: string;
  scope: 'discipline' | 'topic';
  scopeId: string;
  links: LinkItem[] | undefined;
  editingLink: { scope: 'discipline' | 'topic'; scopeId: string; link: LinkItem } | null;
  setEditingLink: React.Dispatch<React.SetStateAction<{ scope: 'discipline' | 'topic'; scopeId: string; link: LinkItem } | null>>;
  handleUpdateLink: () => void;
  handleDeleteLink: (scope: 'discipline' | 'topic', scopeId: string, linkIdToDelete: string) => void;
  newLinkInputs: Record<string, { title: string, url: string }>;
  setNewLinkInputs: React.Dispatch<React.SetStateAction<Record<string, { title: string, url: string }>>>;
  handleAddLink: (scope: 'discipline' | 'topic', scopeId: string) => void;
}

const LinkManager: React.FC<LinkManagerProps> = ({
  title,
  scope,
  scopeId,
  links,
  editingLink,
  setEditingLink,
  handleUpdateLink,
  handleDeleteLink,
  newLinkInputs,
  setNewLinkInputs,
  handleAddLink
}) => {
    return (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h5 className="font-semibold text-slate-300 mb-3 flex items-center gap-2"><Link size={16} className="text-indigo-400"/> {title}</h5>
            <ul className="space-y-2 mb-3">
                {(links || []).map(link => (
                     <li key={link.id} className="group">
                        {editingLink?.link.id === link.id ? (
                            <div className="flex gap-2 items-center">
                                <input type="text" placeholder="Título" value={editingLink.link.title} onChange={(e) => setEditingLink(prev => prev ? {...prev, link: {...prev.link, title: e.target.value}} : null)} className="w-1/3 bg-slate-700 text-slate-200 text-sm p-1 rounded-sm border border-indigo-500 outline-none" />
                                <input type="text" placeholder="URL" value={editingLink.link.url} onChange={(e) => setEditingLink(prev => prev ? {...prev, link: {...prev.link, url: e.target.value}} : null)} className="flex-grow bg-slate-700 text-slate-200 text-sm p-1 rounded-sm border border-indigo-500 outline-none" />
                                <button onClick={handleUpdateLink} className="p-1 text-green-400 hover:text-green-300"><Check size={16}/></button>
                                <button onClick={() => setEditingLink(null)} className="p-1 text-red-400 hover:text-red-300"><X size={16}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <ExternalLink size={14} className="flex-shrink-0 mr-2 text-slate-500"/>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-grow text-sm text-sky-400 hover:text-sky-300 hover:underline truncate" title={link.url}>{link.title}</a>
                                <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingLink({ scope, scopeId, link })} className="p-1 text-slate-500 hover:text-indigo-400"><Pencil size={14}/></button>
                                    <button onClick={() => handleDeleteLink(scope, scopeId, link.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <div className="flex gap-2">
                <input type="text" placeholder="Título do Link" value={newLinkInputs[scopeId]?.title || ''} onChange={(e) => setNewLinkInputs(p => ({...p, [scopeId]: {...(p[scopeId] || {url:''}), title: e.target.value}}))} className="w-1/3 bg-slate-800 text-slate-300 text-sm p-2 rounded-md border border-slate-600 focus:border-indigo-500 outline-none"/>
                <input type="text" placeholder="https://..." value={newLinkInputs[scopeId]?.url || ''} onChange={(e) => setNewLinkInputs(p => ({...p, [scopeId]: {...(p[scopeId] || {title:''}), url: e.target.value}}))} onKeyDown={(e) => e.key === 'Enter' && handleAddLink(scope, scopeId)} className="flex-grow bg-slate-800 text-slate-300 text-sm p-2 rounded-md border border-slate-600 focus:border-indigo-500 outline-none"/>
                <button onClick={() => handleAddLink(scope, scopeId)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-md transition-colors flex-shrink-0"><Plus size={16}/></button>
            </div>
        </div>
    );
};


const StudyPlanner: React.FC = () => {
  const { user, isLoggedIn, activeStudyPlan, saveActiveStudyPlan, clearActiveStudyPlan } = useAuth();
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [activeSubtopicSection, setActiveSubtopicSection] = useState<string | null>(null);
  const [newSubTopicText, setNewSubTopicText] = useState<Record<string, string>>({});
  const [editingSubTopic, setEditingSubTopic] = useState<{ topicId: string; subTopicId: string; text: string } | null>(null);
  const [newLinkInputs, setNewLinkInputs] = useState<Record<string, { title: string, url: string }>>({});
  const [editingLink, setEditingLink] = useState<{ scope: 'discipline' | 'topic'; scopeId: string; link: LinkItem } | null>(null);

  const updateActivePlan = (updater: (prevPlan: StudyPlan) => StudyPlan) => {
    if (activeStudyPlan) {
      saveActiveStudyPlan(updater(activeStudyPlan));
    }
  };

  const handleToggleTopic = (topicId: string) => {
    updateActivePlan(prev => ({
      ...prev,
      checkedTopics: {
        ...prev.checkedTopics,
        [topicId]: !prev.checkedTopics[topicId],
      },
    }));
  };

  const handleAddScore = (discipline: string) => {
    const score = parseFloat(scoreInputs[discipline] || '0');
    if (score >= 0 && score <= 100) {
      updateActivePlan(prev => {
        const newScores = { ...prev.mockScores };
        const currentScores = newScores[discipline] || [];
        newScores[discipline] = [...currentScores, score];
        return { ...prev, mockScores: newScores };
      });
      setScoreInputs(prev => ({...prev, [discipline]: ''}));
    } else {
      alert("Por favor, insira uma nota válida entre 0 e 100.");
    }
  };

  const handleClearPlan = () => {
    if (window.confirm("Tem certeza que deseja apagar todo o progresso deste plano de estudos? Esta ação não pode ser desfeita.")) {
      clearActiveStudyPlan();
    }
  };

  // --- SUBTOPIC LOGIC ---
  const handleToggleSubtopicSection = (topicId: string) => {
    setActiveSubtopicSection(prev => (prev === topicId ? null : topicId));
  };
  
  const handleAddSubTopic = (topicId: string) => {
      const text = (newSubTopicText[topicId] || '').trim();
      if (!text) return;
      const newSubTopic: SubTopic = { id: Date.now().toString(), text, completed: false };
      updateActivePlan(prev => {
          const currentSubTopics = prev.subTopics[topicId] || [];
          const newSubTopics = { ...prev.subTopics, [topicId]: [...currentSubTopics, newSubTopic] };
          return { ...prev, subTopics: newSubTopics };
      });
      setNewSubTopicText(prev => ({ ...prev, [topicId]: '' }));
  };

  const handleToggleSubTopic = (topicId: string, subTopicId: string) => {
    updateActivePlan(prev => {
      const updatedSubTopics = (prev.subTopics[topicId] || []).map(st => 
        st.id === subTopicId ? { ...st, completed: !st.completed } : st
      );
      return { ...prev, subTopics: { ...prev.subTopics, [topicId]: updatedSubTopics } };
    });
  };

  const handleDeleteSubTopic = (topicId: string, subTopicId: string) => {
    updateActivePlan(prev => {
      const updatedSubTopics = (prev.subTopics[topicId] || []).filter(st => st.id !== subTopicId);
      return { ...prev, subTopics: { ...prev.subTopics, [topicId]: updatedSubTopics } };
    });
  };

  const handleUpdateSubTopic = () => {
      if (!editingSubTopic) return;
      const { topicId, subTopicId, text } = editingSubTopic;
      updateActivePlan(prev => {
          const updatedSubTopics = (prev.subTopics[topicId] || []).map(st => 
              st.id === subTopicId ? { ...st, text: text } : st
          );
          return { ...prev, subTopics: { ...prev.subTopics, [topicId]: updatedSubTopics } };
      });
      setEditingSubTopic(null);
  }
  
  // --- LINK LOGIC ---
  const isValidUrl = (urlString: string) => {
    try {
        new URL(urlString);
        return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch (e) {
        return false;
    }
  };

  const handleAddLink = (scope: 'discipline' | 'topic', scopeId: string) => {
    const { title, url } = newLinkInputs[scopeId] || { title: '', url: ''};
    if (!title.trim() || !url.trim()) {
        alert("Título e URL são obrigatórios.");
        return;
    }
    if (!isValidUrl(url)) {
        alert("Por favor, insira uma URL válida (começando com http:// ou https://).");
        return;
    }
    const newLink: LinkItem = { id: Date.now().toString(), title, url };
    updateActivePlan(prev => {
        if (scope === 'discipline') {
            const currentLinks = prev.disciplineLinks[scopeId] || [];
            const newLinks = { ...prev.disciplineLinks, [scopeId]: [...currentLinks, newLink]};
            return { ...prev, disciplineLinks: newLinks };
        } else {
            const currentLinks = prev.topicLinks[scopeId] || [];
            const newLinks = { ...prev.topicLinks, [scopeId]: [...currentLinks, newLink]};
            return { ...prev, topicLinks: newLinks };
        }
    });
    setNewLinkInputs(prev => ({ ...prev, [scopeId]: { title: '', url: '' } }));
  };

  const handleDeleteLink = (scope: 'discipline' | 'topic', scopeId: string, linkIdToDelete: string) => {
     updateActivePlan(prev => {
        if (scope === 'discipline') {
            const updatedLinks = (prev.disciplineLinks[scopeId] || []).filter(l => l.id !== linkIdToDelete);
            return { ...prev, disciplineLinks: { ...prev.disciplineLinks, [scopeId]: updatedLinks } };
        } else {
             const updatedLinks = (prev.topicLinks[scopeId] || []).filter(l => l.id !== linkIdToDelete);
            return { ...prev, topicLinks: { ...prev.topicLinks, [scopeId]: updatedLinks } };
        }
    });
  };

  const handleUpdateLink = () => {
    if (!editingLink) return;
    const { scope, scopeId, link } = editingLink;
     if (!link.title.trim() || !link.url.trim() || !isValidUrl(link.url)) {
        alert("Por favor, preencha o título e uma URL válida.");
        return;
    }
    updateActivePlan(prev => {
        const mapLinks = (l: LinkItem) => l.id === link.id ? link : l;
        if (scope === 'discipline') {
            const updatedLinks = (prev.disciplineLinks[scopeId] || []).map(mapLinks);
            return { ...prev, disciplineLinks: { ...prev.disciplineLinks, [scopeId]: updatedLinks } };
        } else {
            const updatedLinks = (prev.topicLinks[scopeId] || []).map(mapLinks);
            return { ...prev, topicLinks: { ...prev.topicLinks, [scopeId]: updatedLinks } };
        }
    });
    setEditingLink(null);
  };

  const performanceData = useMemo(() => {
    if (!activeStudyPlan) return { overallAverage: 0, subjectAverages: [], overallProgress: 0 };
    const { editalData, mockScores, checkedTopics } = activeStudyPlan;
    let totalScores = 0, totalScoreSum = 0;
    const subjectAverages: { name: string; average: number; }[] = [];

    editalData.conteudo_programatico?.forEach(d => {
        const scores = mockScores[d.disciplina || ''] || [];
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            totalScoreSum += sum;
            totalScores += scores.length;
            subjectAverages.push({ name: d.disciplina || '', average: sum / scores.length });
        }
    });

    const overallAverage = totalScores > 0 ? totalScoreSum / totalScores : 0;
    
    let totalTopics = 0, totalChecked = 0;
    editalData.conteudo_programatico?.forEach((d) => {
        totalTopics += d.topicos?.length || 0;
        d.topicos?.forEach((_, tIndex) => {
             if(checkedTopics[`${d.disciplina}-${tIndex}`]){ totalChecked++; }
        });
    });

    const overallProgress = totalTopics > 0 ? (totalChecked / totalTopics) * 100 : 0;
    return { overallAverage, subjectAverages, overallProgress };
  }, [activeStudyPlan]);

  if (!activeStudyPlan) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 text-center text-slate-400">
        <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-200">Nenhum plano de estudos ativo.</h2>
        <p className="mt-2">Vá para a aba "Verticalizar Edital" para processar um documento e criar seu plano de estudos personalizado.</p>
        {user && <p className="mt-1">Como usuário registrado, você pode criar e salvar múltiplos planos.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PlanManager />
      <Dashboard performanceData={performanceData} />

      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center text-2xl font-bold text-slate-100">
                <BookOpen className="h-7 w-7 mr-3 text-indigo-400" />
                Conteúdo Programático
            </h2>
            <button onClick={handleClearPlan} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 bg-red-900/50 border border-red-800 rounded-md hover:bg-red-900 transition-colors"><Trash2 size={14} /> Limpar Progresso</button>
        </div>
        <div className="space-y-6">
          {activeStudyPlan.editalData.conteudo_programatico?.map((disciplina, dIndex) => {
            const disciplineTopics = disciplina.topicos?.length || 0;
            const disciplineChecked = disciplina.topicos?.reduce((count, _, tIndex) => activeStudyPlan.checkedTopics[`${disciplina.disciplina}-${tIndex}`] ? count + 1 : count, 0) || 0;
            const disciplineProgress = disciplineTopics > 0 ? (disciplineChecked / disciplineTopics) * 100 : 0;
            const disciplineName = disciplina.disciplina || `disciplina-${dIndex}`;
            
            return (
              <details key={disciplineName} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden" open>
                <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex-grow pr-4">
                      <h4 className="text-lg font-semibold text-indigo-400">{disciplineName}</h4>
                      <div className="mt-2"><ProgressBar progress={disciplineProgress} /></div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-200 transform details-open:rotate-180 flex-shrink-0" />
                </summary>
                <div className="p-4 border-t border-slate-700">
                  <ul className="space-y-2 list-none p-0 mb-6">
                    {disciplina.topicos?.map((topico, tIndex) => {
                      const topicId = `${disciplineName}-${tIndex}`;
                      const isChecked = !!activeStudyPlan.checkedTopics[topicId];
                      const subTopics = activeStudyPlan.subTopics[topicId] || [];
                      const completedSubTopics = subTopics.filter(st => st.completed).length;
                      const isSubtopicSectionOpen = activeSubtopicSection === topicId;

                      return (
                        <li key={topicId} className="bg-slate-900/40 rounded-md transition-all duration-300">
                            <div className="flex items-center text-slate-300 py-2 px-3 group">
                                <div onClick={() => handleToggleTopic(topicId)} className={`w-5 h-5 flex-shrink-0 mr-3 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${ isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent border-slate-600 group-hover:border-indigo-500'}`} role="checkbox" aria-checked={isChecked}>
                                   {isChecked && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <div onClick={() => handleToggleSubtopicSection(topicId)} className={`flex-grow cursor-pointer transition-colors ${isChecked ? 'line-through text-slate-500' : 'group-hover:text-slate-100'}`}>
                                    {topico}
                                    {subTopics.length > 0 && <span className="ml-2 text-xs font-mono text-slate-500">({completedSubTopics}/{subTopics.length})</span>}
                                </div>
                            </div>

                            {isSubtopicSectionOpen && (
                                <div className="pl-10 pr-4 pb-3 -mt-1 space-y-3">
                                   <ul className="space-y-2">
                                        {subTopics.map(st => (
                                          <li key={st.id} className="flex items-center group">
                                            <div onClick={() => handleToggleSubTopic(topicId, st.id)} role="checkbox" aria-checked={st.completed} className={`w-4 h-4 flex-shrink-0 mr-3 rounded border flex items-center justify-center cursor-pointer transition-all duration-200 ${st.completed ? 'bg-green-600 border-green-600' : 'bg-transparent border-slate-500 group-hover:border-green-500'}`}>
                                                {st.completed && <Check className="w-3 h-3 text-white"/>}
                                            </div>
                                            {editingSubTopic?.subTopicId === st.id ? (
                                                <input type="text" value={editingSubTopic.text} onChange={(e) => setEditingSubTopic({...editingSubTopic, text: e.target.value})} onBlur={handleUpdateSubTopic} onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubTopic()} className="flex-grow bg-slate-700 text-slate-200 text-sm p-1 rounded-sm border border-indigo-500 outline-none" autoFocus />
                                            ) : (
                                                <span className={`flex-grow text-sm ${st.completed ? 'line-through text-slate-500' : 'text-slate-400'}`}>{st.text}</span>
                                            )}
                                            <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingSubTopic({ topicId, subTopicId: st.id, text: st.text})} className="p-1 text-slate-500 hover:text-indigo-400"><Pencil size={14}/></button>
                                                <button onClick={() => handleDeleteSubTopic(topicId, st.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                            </div>
                                          </li>
                                        ))}
                                   </ul>
                                   <div className="flex gap-2">
                                       <input type="text" placeholder="Adicionar subtópico..." value={newSubTopicText[topicId] || ''} onChange={(e) => setNewSubTopicText(prev => ({ ...prev, [topicId]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleAddSubTopic(topicId)} className="w-full bg-slate-800 text-slate-300 text-sm focus:outline-none p-2 rounded-md border border-slate-600 focus:border-indigo-500 transition-colors" />
                                       <button onClick={() => handleAddSubTopic(topicId)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-md transition-colors flex-shrink-0"><Plus size={16}/></button>
                                   </div>
                                   <LinkManager
                                      title="Links de Questões do Tópico"
                                      scope="topic"
                                      scopeId={topicId}
                                      links={activeStudyPlan.topicLinks[topicId]}
                                      editingLink={editingLink}
                                      setEditingLink={setEditingLink}
                                      handleUpdateLink={handleUpdateLink}
                                      handleDeleteLink={handleDeleteLink}
                                      newLinkInputs={newLinkInputs}
                                      setNewLinkInputs={setNewLinkInputs}
                                      handleAddLink={handleAddLink}
                                  />
                                </div>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                   <div className="mt-4 p-4 bg-slate-900/50 rounded-md border border-slate-700 space-y-4">
                        <div>
                            <h5 className="font-semibold text-slate-300 mb-2">Adicionar Nota de Simulado (%)</h5>
                            <div className="flex gap-2 items-center">
                                <input type="number" min="0" max="100" placeholder="Ex: 85.5" value={scoreInputs[disciplineName] || ''} onChange={(e) => setScoreInputs(prev => ({...prev, [disciplineName]: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleAddScore(disciplineName)} className="w-full bg-slate-800 text-slate-300 focus:outline-none p-2 rounded-md border border-slate-600 focus:border-indigo-500 transition-colors" />
                                <button onClick={() => handleAddScore(disciplineName)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-md transition-colors flex-shrink-0"><Plus size={20}/></button>
                            </div>
                             {(activeStudyPlan.mockScores[disciplineName]?.length ?? 0) > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <h6 className="text-sm font-medium text-slate-400 mb-2">Notas Registradas:</h6>
                                    <div className="flex flex-wrap gap-2">
                                        {(activeStudyPlan.mockScores[disciplineName] || []).map((score, i) => (<span key={i} className="bg-slate-700 text-slate-200 text-xs font-mono px-2 py-1 rounded-full">{score.toFixed(1)}%</span>))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <LinkManager
                            title="Links Gerais da Disciplina"
                            scope="discipline"
                            scopeId={disciplineName}
                            links={activeStudyPlan.disciplineLinks[disciplineName]}
                            editingLink={editingLink}
                            setEditingLink={setEditingLink}
                            handleUpdateLink={handleUpdateLink}
                            handleDeleteLink={handleDeleteLink}
                            newLinkInputs={newLinkInputs}
                            setNewLinkInputs={setNewLinkInputs}
                            handleAddLink={handleAddLink}
                        />
                   </div>
                </div>
              </details>
            );
          })}
        </div>
        <style>{`
          details > summary::-webkit-details-marker { display: none; }
          details[open] .details-open\\:rotate-180 { transform: rotate(180deg); }
        `}</style>
      </div>
    </div>
  );
};

export default StudyPlanner;