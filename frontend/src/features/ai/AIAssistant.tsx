import { useState, useEffect } from 'react';
import { aiApi, projectApi } from '../../services/api';
import { Bot, Bug, FileCode, CheckCircle, Loader2, Sparkles, Send, Copy } from 'lucide-react';
import { toast } from 'sonner';

export const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState<'bug' | 'tasks'>('bug');

  // Bug Analysis State
  const [errorLog, setErrorLog] = useState('');
  const [bugAnalysis, setBugAnalysis] = useState<string | null>(null);

  // Task Gen State
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [taskGenStatus, setTaskGenStatus] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.list();
        setProjects(res.data);
        if (res.data.length > 0) {
          setProjectId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load projects');
      }
    };
    fetchProjects();
  }, []);

  const handleBugSubmit = async () => {
    setIsLoading(true);
    setBugAnalysis(null);
    try {
      const res = await aiApi.analyzeBug(errorLog);
      pollStatus(res.data.task_id, 'bug');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit bug analysis request.');
      setIsLoading(false);
    }
  };

  const handleTaskSubmit = async () => {
    setIsLoading(true);
    setTaskGenStatus(null);
    try {
      const res = await aiApi.generateTasks(parseInt(projectId), description);
      pollStatus(res.data.task_id, 'tasks');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit task generation request.');
      setIsLoading(false);
    }
  };

  const pollStatus = async (taskId: string, type: 'bug' | 'tasks') => {
    const interval = setInterval(async () => {
      try {
        const res = await aiApi.getStatus(taskId);
        if (res.data.status === 'SUCCESS') {
          clearInterval(interval);
          setIsLoading(false);
          if (type === 'bug') {
            setBugAnalysis(res.data.result.analysis);
            toast.success('Analysis complete!');
          } else {
            setTaskGenStatus(`Successfully generated ${res.data.result.tasks_created} tasks!`);
            toast.success(`Generated ${res.data.result.tasks_created} tasks!`);
          }
        } else if (res.data.status === 'FAILURE') {
          clearInterval(interval);
          setIsLoading(false);
          if (type === 'bug') setBugAnalysis('Analysis failed. Please check your API configuration.');
          else setTaskGenStatus('Task generation failed. Please try again.');
          toast.error('AI processing failed.');
        }
      } catch (err) {
        clearInterval(interval);
        setIsLoading(false);
        toast.error('Lost connection to processing server.');
      }
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center glow-brand">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Engineering Assistant</h1>
          <p className="text-sm text-slate-400">Powered by GPT-4 • Analyze bugs & auto-generate tasks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-1 p-1 rounded-xl border border-glass-border w-fit">
        <button
          id="tab-bug"
          onClick={() => setActiveTab('bug')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'bug'
              ? 'gradient-brand text-white shadow-lg shadow-brand-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-glass-white'
          }`}
        >
          <Bug className="w-4 h-4" />
          Bug Analyzer
        </button>
        <button
          id="tab-tasks"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'tasks'
              ? 'gradient-brand text-white shadow-lg shadow-brand-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-glass-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Task Generator
        </button>
      </div>

      {/* Content */}
      <div className="bg-surface-1 rounded-2xl border border-glass-border overflow-hidden">
        {activeTab === 'bug' ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Paste your error log or stack trace
              </label>
              <textarea
                id="bug-error-input"
                className="w-full h-48 p-4 font-mono text-sm bg-surface-0 border border-glass-border rounded-xl text-slate-300 placeholder-slate-600 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all resize-none"
                placeholder="TypeError: Cannot read properties of undefined...&#10;    at Object.handleClick (/src/components/Button.tsx:42:12)&#10;    at HTMLButtonElement.callCallback (react-dom.development.js:3945:14)"
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
              />
            </div>
            <button
              id="analyze-bug-btn"
              onClick={handleBugSubmit}
              disabled={isLoading || !errorLog}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Analyze Root Cause
            </button>

            {bugAnalysis && (
              <div className="mt-6 relative">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => copyToClipboard(bugAnalysis)}
                    className="p-2 rounded-lg bg-glass-white text-slate-400 hover:text-white transition-all"
                    title="Copy analysis"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 bg-surface-0 rounded-xl border border-glass-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-sm font-semibold text-white">AI Analysis</h3>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">{bugAnalysis}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Project
                </label>
                <select
                  id="task-gen-project-id"
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none cursor-pointer"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="" disabled>Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Project / Feature Description
              </label>
              <textarea
                id="task-gen-desc"
                className="w-full h-36 p-4 bg-surface-0 border border-glass-border rounded-xl text-slate-300 placeholder-slate-500 text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none resize-none"
                placeholder="We need to build a new payment gateway integration using Stripe. It should handle subscription billing, one-time payments, and webhook processing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              id="generate-tasks-btn"
              onClick={handleTaskSubmit}
              disabled={isLoading || !description || !projectId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Tasks
            </button>

            {taskGenStatus && (
              <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-300 font-medium">{taskGenStatus}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
