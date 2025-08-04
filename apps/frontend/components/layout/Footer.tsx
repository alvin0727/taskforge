import React from "react";
import { Mail, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full h-full bg-neutral-900 border-t border-neutral-800 flex flex-col items-center py-4">
      <div className="flex flex-col h-full w-full justify-between items-center">
        {/* Name at top */}
        <div className="flex flex-col items-center text-blue-400 font-bold text-lg tracking-widest select-none pt-2 pb-2">
          {"BY Alvin".split("").map((char, idx) => (
            <span key={idx}>{char === " " ? <span>&nbsp;</span> : char}</span>
          ))}
        </div>
        {/* Icons centered vertically */}
        <div className="flex flex-col items-center justify-center flex-grow mt-8 mb-8 gap-6">
          <a
            href="https://www.linkedin.com/in/alvinboysgea"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={28} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
          </a>
          <a
            href="https://github.com/alvin0727"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="GitHub"
          >
            <Github size={28} className="text-white group-hover:text-blue-400 transition-colors" />
          </a>
          <a
            href="mailto:alvinboys2020@gmail.com"
            className="group flex items-center justify-center text-neutral-400 hover:text-blue-400 transition-colors"
            aria-label="Email"
          >
            <Mail size={28} className="text-red-400 group-hover:text-blue-400 transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}