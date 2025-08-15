export const detectLanguage = (code: string): string => {
    if (!code.trim()) return 'text';
    
    // Simple language detection based on common patterns
    const lowerCode = code.toLowerCase();
    
    // JavaScript/TypeScript
    if (code.includes('function') || code.includes('=>') || code.includes('const ') || code.includes('let ') || code.includes('var ')) {
        if (code.includes('interface ') || code.includes('type ') || code.includes(': string') || code.includes(': number')) {
            return 'typescript';
        }
        return 'javascript';
    }
    
    // React JSX/TSX
    if (code.includes('import React') || code.includes('<div') || code.includes('</div>') || code.includes('className=')) {
        return 'jsx';
    }
    
    // Python
    if (code.includes('def ') || code.includes('import ') || code.includes('from ') || code.includes('print(')) {
        return 'python';
    }
    
    // HTML
    if (code.includes('<html>') || code.includes('<!DOCTYPE') || code.includes('<head>') || code.includes('<body>')) {
        return 'html';
    }
    
    // CSS
    if (code.includes('{') && (code.includes('color:') || code.includes('background:') || code.includes('margin:') || code.includes('padding:'))) {
        return 'css';
    }
    
    // JSON
    if ((code.trim().startsWith('{') && code.trim().endsWith('}')) || (code.trim().startsWith('[') && code.trim().endsWith(']'))) {
        try {
            JSON.parse(code);
            return 'json';
        } catch (e) {
            // Not valid JSON
        }
    }
    
    // SQL
    if (lowerCode.includes('select ') || lowerCode.includes('from ') || lowerCode.includes('where ') || lowerCode.includes('insert into')) {
        return 'sql';
    }
    
    // PHP
    if (code.includes('<?php') || code.includes('<?=')) {
        return 'php';
    }
    
    // Java
    if (code.includes('public class') || code.includes('import java') || code.includes('public static void main')) {
        return 'java';
    }
    
    // C/C++
    if (code.includes('#include') || code.includes('int main') || code.includes('printf(') || code.includes('cout <<')) {
        return 'cpp';
    }
    
    // Bash/Shell
    if (code.includes('#!/bin/bash') || code.includes('$ ') || lowerCode.includes('echo ') || lowerCode.includes('cd ')) {
        return 'bash';
    }
    
    // XML
    if (code.includes('<?xml') || (code.includes('<') && code.includes('>') && !code.includes('function'))) {
        return 'xml';
    }
    
    return 'text';
};