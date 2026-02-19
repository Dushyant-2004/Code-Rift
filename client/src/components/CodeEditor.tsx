"use client";

// @ts-ignore - types resolve at build time via next/dynamic
import Editor from "@monaco-editor/react";
import { memo } from "react";

interface CodeEditorProps {
  height?: string;
  language: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  fontSize?: number;
}

function CodeEditor({
  height = "500px",
  language,
  value,
  onChange,
  readOnly = false,
  fontSize = 14,
}: CodeEditorProps) {
  const handleChange = (val: string | undefined) => {
    onChange?.(val || "");
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={readOnly ? undefined : handleChange}
      theme="vs-dark"
      loading={<div className="h-full w-full skeleton" />}
      options={{
        readOnly,
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        padding: { top: 16 },
        lineNumbers: "on",
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        renderLineHighlight: "gutter",
        cursorBlinking: "smooth",
        smoothScrolling: true,
      }}
    />
  );
}

export default memo(CodeEditor);
