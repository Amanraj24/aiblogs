import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown/lib/ast-to-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: Components;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', components }) => {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
