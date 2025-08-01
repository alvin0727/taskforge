

import React from "react";
import { Mail, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full h-16 bg-neutral-900 text-neutral-300 border-t border-neutral-800 py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} TaskForge. Built by <span className="font-semibold text-blue-400">Alvin Boys Gea</span>.
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://www.linkedin.com/in/alvinboysgea"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors flex items-center gap-1"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} /> LinkedIn
          </a>
          <a
            href="https://github.com/alvin0727"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors flex items-center gap-1"
            aria-label="GitHub"
          >
            <Github size={18} /> GitHub
          </a>
          <a
            href="mailto:alvinboys2020@gmail.com"
            className="hover:text-blue-400 transition-colors flex items-center gap-1"
            aria-label="Email"
          >
            <Mail size={18} /> Email
          </a>
        </div>
      </div>
    </footer>
  );
}
