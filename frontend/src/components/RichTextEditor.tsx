import { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Eye, EyeOff } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}

const markdownToHtml = (md: string): string => {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-surface-0 px-1.5 py-0.5 rounded text-brand-primary text-xs">$1</code>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-bold text-white mt-3 mb-1">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold text-white mt-3 mb-1">$1</h1>')
    // Unordered list
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-slate-300 list-disc">$1</li>')
    // Ordered list
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-slate-300 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(\s*<br\s*\/?>)?)+/g, (match) => {
    return `<ul class="my-1">${match.replace(/<br \/>/g, '')}</ul>`;
  });

  return html;
};

export const RichTextEditor = ({ value, onChange, onBlur, placeholder, rows = 4 }: RichTextEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('.rich-text-input') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newText);
  };

  return (
    <div className="rounded-xl border border-glass-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-0 border-b border-glass-border">
        <button
          type="button"
          onClick={() => insertMarkdown('**', '**')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-glass-white transition-all"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('*', '*')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-glass-white transition-all"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('`', '`')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-glass-white transition-all"
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-glass-border mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown('- ')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-glass-white transition-all"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('1. ')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-glass-white transition-all"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            showPreview ? 'text-brand-primary bg-brand-primary/10' : 'text-slate-500 hover:text-white hover:bg-glass-white'
          }`}
        >
          {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className="px-4 py-3 text-sm min-h-[80px] bg-surface-0 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || '<span class="text-slate-500">Nothing to preview</span>' }}
        />
      ) : (
        <textarea
          className="rich-text-input w-full px-4 py-3 bg-surface-0 text-sm text-white placeholder-slate-500 outline-none resize-none border-none focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder || "Write in markdown..."}
          rows={rows}
        />
      )}
    </div>
  );
};
