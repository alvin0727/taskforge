import React from "react";
import { Mail, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-900 border-t border-neutral-800 py-6 h-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-center md:text-left text-neutral-400">
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">TaskForge</span>. Built with 💙 by{" "}
          <span className="font-semibold text-blue-400">Alvin Boys Gea</span>.
        </div>
        <div className="flex items-center gap-5 text-sm">
          <a
            href="https://www.linkedin.com/in/alvinboysgea"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://github.com/alvin0727"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} className="text-white group-hover:text-blue-400 transition-colors" />
            <span>GitHub</span>
          </a>
          <a
            href="mailto:alvinboys2020@gmail.com"
            className="group flex items-center gap-2 text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="Email"
          >
            <Mail size={18} className="text-red-400 group-hover:text-blue-400 transition-colors" />
            <span>Email</span>
          </a>
        </div>
      </div>
    </footer>
  );
}