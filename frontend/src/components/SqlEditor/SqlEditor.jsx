import { useState, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import './SqlEditor.css';

Prism.manual = true;

function SqlEditor({ value, onChange, readOnly = false, placeholder }) {
  const [focused, setFocused] = useState(false);

  const highlight = useCallback((code) => {
    if (!code || !code.trim()) return '';
    try {
      return Prism.highlight(code, Prism.languages.sql, 'sql');
    } catch {
      return code;
    }
  }, []);

  return (
    <div className={`sql-editor-wrapper ${focused ? 'sql-editor-focused' : ''}`}>
      <Editor
        value={value}
        onValueChange={(code) => onChange(code)}
        highlight={highlight}
        padding={12}
        tabSize={2}
        insertSpaces
        readOnly={readOnly}
        placeholder={placeholder || 'SELECT * FROM employees LIMIT 100'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textareaClassName="sql-editor-textarea"
        preClassName="sql-editor-pre"
        className="sql-editor"
        style={{
          fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
          fontSize: '0.85rem',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
}

export default SqlEditor;
