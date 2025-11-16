import React, { useState, useCallback, useRef } from 'react';
import { verticalizeEdital, FilePart } from './services/geminiService';
import Header from './components/Header';
import Loader from './components/Loader';
import ResultDisplay from './components/ResultDisplay';
import ExportButtons from './components/ExportButtons';
import type { EditalData } from './types';
import StudyPlanner from './components/StudyPlanner';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Bot, Zap, AlertTriangle, FileUp, User, Info, XCircle, BookCheck, LayoutList } from 'lucide-react';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [lastProcessedEdital, setLastProcessedEdital] = useState<EditalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [cargo, setCargo] = useState<string>('');
  const [mainTab, setMainTab] = useState<MainTab>('verticalizer');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { processNewEditalData } = useAuth();

  type MainTab = 'verticalizer' | 'planner';

  const extractJson = (text: string): EditalData | null => {
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
          console.error("Could not find a valid JSON object within the text.", "Original text:", text);
          setError("A resposta da IA não continha um objeto JSON válido. Por favor, tente novamente.");
          return null;
      }

      const jsonString = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonString);

    } catch (e) {
        console.error("Failed to parse JSON from string:", e, "Original text:", text);
        setError("A resposta da IA não estava no formato JSON esperado e não pôde ser lida. Por favor, tente novamente.");
        return null;
    }
  };

  const fileToGenerativePart = async (file: File): Promise<FilePart> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 4 * 1024 * 1024) { 
            setError("O arquivo é muito grande. O limite é de 4MB.");
            setFile(null);
            return;
        }
        setError(null);
        setFile(selectedFile);
        setTextInput('');
    }
  };
  
  const handleTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextInput(event.target.value);
      if (file) {
          setFile(null);
      }
  };
  
  const handleCancel = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setError("Processamento cancelado pelo usuário.");
        setIsLoading(false);
    }
  };

  const handleProcessEdital = useCallback(async () => {
    if (!cargo.trim()) {
        setError('O campo "Cargo Pretendido" é obrigatório.');
        return;
    }
     if (!file && !textInput.trim()) {
        setError('Por favor, cole o texto do edital ou envie um arquivo.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setRawResult(null);
    setLastProcessedEdital(null);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let response;
      if (file) {
        const filePart = await fileToGenerativePart(file);
        response = await verticalizeEdital(filePart, cargo, signal);
      } else if (textInput.trim()) {
        response = await verticalizeEdital(textInput, cargo, signal);
      } else {
        setError('Por favor, cole o texto do edital ou envie um arquivo.');
        setIsLoading(false);
        return;
      }
      setRawResult(response);
      const jsonData = extractJson(response);
      if(jsonData) {
        setLastProcessedEdital(jsonData);
        const created = await processNewEditalData(jsonData);
        if (created) {
           setMainTab('planner');
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        setError(
            err instanceof Error
            ? err.message
            : 'An unknown error occurred. Please check the console for details.'
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [textInput, file, cargo, processNewEditalData]);
  
  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header onLoginClick={() => setIsLoginModalOpen(true)} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex border-b border-slate-700">
            <button
                onClick={() => setMainTab('verticalizer')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${mainTab === 'verticalizer' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <LayoutList size={16} /> Verticalizar Edital
            </button>
            <button
                onClick={() => setMainTab('planner')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${mainTab === 'planner' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <BookCheck size={16} /> Meu Plano de Estudos
            </button>
        </div>

        {mainTab === 'verticalizer' && (
          <div>
            <div className="bg-slate-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
              <div className="text-center mb-6">
                 <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full p-3 mb-4 border border-indigo-500/30">
                    <Bot size={32} />
                 </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
                  Verticalizador de Editais com IA
                </h2>
                <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
                  Cole o texto, envie um arquivo (imagem ou PDF) e informe o cargo desejado para criar um plano de estudos interativo.
                </p>
              </div>

              <div className="max-w-3xl mx-auto my-6 p-4 bg-sky-900/50 border border-sky-700 rounded-lg flex items-start gap-3">
                  <Info className="h-5 w-5 text-sky-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-sky-300">
                    <strong>Dica:</strong> Para um resultado mais rápido e preciso, cole ou envie apenas a seção do <strong>'Conteúdo Programático'</strong> do seu edital.
                  </p>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="relative">
                  <User className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Cargo Pretendido (obrigatório)"
                    className="w-full bg-slate-900/70 text-slate-300 focus:outline-none p-3 pl-11 rounded-lg border border-slate-700 focus:border-indigo-500 transition-colors"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>
              
                <textarea
                  placeholder="Cole o texto completo do edital aqui..."
                  className="w-full h-48 bg-slate-900/70 text-slate-300 resize-none focus:outline-none custom-scrollbar p-4 rounded-lg border border-slate-700 focus:border-indigo-500 transition-colors"
                  value={textInput}
                  onChange={handleTextInputChange}
                  disabled={!!file}
                />
                
                <div className="text-center text-slate-500 font-semibold">OU</div>

                <div className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:bg-slate-800/50 transition-colors data-[has-file=true]:border-indigo-500 data-[has-file=true]:bg-slate-800/50" data-has-file={!!file}>
                  <input type="file" id="file-upload" onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer p-4 text-center w-full h-full">
                      <FileUp className="h-8 w-8 mb-2 text-slate-500" />
                      <span className="font-semibold text-indigo-400">{file ? file.name : 'Clique para selecionar um arquivo'}</span>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF, etc. (Máx 4MB)</p>
                  </label>
                </div>
              </div>

              <div className="text-center mt-8">
                {isLoading ? (
                     <button
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-semibold rounded-lg shadow-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105"
                    >
                        <XCircle className="mr-2 h-5 w-5" />
                        Cancelar
                    </button>
                ) : (
                    <button
                        onClick={handleProcessEdital}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                        <Zap className="mr-2 h-5 w-5" />
                        Verticalizar e Criar Plano
                    </button>
                )}
              </div>
            </div>
            
            {error && (
                <div className="mt-8 bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-4 flex items-center max-w-3xl mx-auto">
                    <AlertTriangle className="h-5 w-5 mr-3 text-red-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Ocorreu um erro</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}
            
            {isLoading && (
                <div className="mt-8 text-center text-slate-400 flex items-center justify-center">
                    <Loader/>
                    <span>Analisando o edital com a IA...</span>
                </div>
            )}

            {rawResult && lastProcessedEdital && !isLoading && (
                <div className="mt-12">
                     <div className="bg-green-900/50 text-green-300 border border-green-700 rounded-lg p-4 flex items-center max-w-3xl mx-auto mb-6">
                        <Info className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">Sucesso!</h3>
                            <p>Seu plano de estudos foi criado. Você pode acessá-lo e gerenciá-lo na aba "Meu Plano de Estudos".</p>
                        </div>
                    </div>
                    <ExportButtons editalData={lastProcessedEdital} />
                    <ResultDisplay data={lastProcessedEdital} />
                </div>
            )}
          </div>
        )}

        {mainTab === 'planner' && <StudyPlanner />}

      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};


export default App;