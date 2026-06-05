import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Bug, FileCode, CheckCircle, Loader2 } from 'lucide-react';

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

  const handleBugSubmit = async () => {
    setIsLoading(true);
    setBugAnalysis(null);
    try {
      const res = await api.post('/ai/analyze-bug', { error_log: errorLog });
      pollStatus(res.data.task_id, 'bug');
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleTaskSubmit = async () => {
    setIsLoading(true);
    setTaskGenStatus(null);
    try {
      const res = await api.post('/ai/generate-tasks', { 
        project_id: parseInt(projectId), 
        description 
      });
      pollStatus(res.data.task_id, 'tasks');
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const pollStatus = async (taskId: string, type: 'bug' | 'tasks') => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/ai/status/${taskId}`);
        if (res.data.status === 'SUCCESS') {
          clearInterval(interval);
          setIsLoading(false);
          if (type === 'bug') {
            setBugAnalysis(res.data.result.analysis);
          } else {
            setTaskGenStatus(`Successfully generated ${res.data.result.tasks_created} tasks!`);
          }
        } else if (res.data.status === 'FAILURE') {
          clearInterval(interval);
          setIsLoading(false);
          if (type === 'bug') setBugAnalysis('Analysis failed.');
          else setTaskGenStatus('Task generation failed.');
        }
      } catch (err) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-8">
        <Bot className="w-8 h-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">AI Engineering Assistant</h1>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('bug')}
          className={`pb-4 flex items-center font-medium ${activeTab === 'bug' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Bug className="w-5 h-5 mr-2" />
          Bug Analyzer
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-4 flex items-center font-medium ${activeTab === 'tasks' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileCode className="w-5 h-5 mr-2" />
          Task Generator
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'bug' ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Paste your error log or stack trace:</label>
            <textarea
              className="w-full h-48 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="TypeError: Cannot read properties of undefined..."
              value={errorLog}
              onChange={(e) => setErrorLog(e.target.value)}
            />
            <button
              onClick={handleBugSubmit}
              disabled={isLoading || !errorLog}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bug className="w-5 h-5 mr-2" />}
              Analyze Root Cause
            </button>
            
            {bugAnalysis && (
              <div className="mt-6 p-6 bg-gray-900 text-gray-100 rounded-md">
                <h3 className="text-lg font-semibold text-white mb-4">AI Analysis</h3>
                <pre className="whitespace-pre-wrap font-sans text-sm">{bugAnalysis}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Project ID:</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. 1"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project/Feature Description:</label>
              <textarea
                className="w-full h-32 p-4 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="We need to build a new payment gateway integration using Stripe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              onClick={handleTaskSubmit}
              disabled={isLoading || !description || !projectId}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileCode className="w-5 h-5 mr-2" />}
              Generate Tasks
            </button>

            {taskGenStatus && (
              <div className="mt-4 flex items-center p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                <CheckCircle className="w-5 h-5 mr-2" />
                {taskGenStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
