import {useMemo} from 'react';
import katex from 'katex';

interface MathBlockProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders genuine LaTeX mathematical expressions (2D matrices, determinants,
 * curly-brace systems of equations, fractions, indices) like a real textbook.
 */
export function MathBlock({
  latex,
  displayMode = true,
  className = '',
}: MathBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch {
      return '';
    }
  }, [latex, displayMode]);

  if (!html) {
    return (
      <div className={`font-serif text-sm ${className}`}>
        {latex}
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto py-1 text-slate-900 dark:text-[#F3F4F6] ${className}`}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
