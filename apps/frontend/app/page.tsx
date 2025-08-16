import React from 'react';
import Link from 'next/link';
import {
    CheckSquare,
    ArrowRight,
    Github,
    Linkedin,
    Mail,
    Bot,
    Layers,
} from 'lucide-react';

export default function TaskForgeLanding() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">TF</span>
                            </div>
                            <span className="text-xl font-bold text-white">TaskForge</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/user/login" className="text-neutral-400 hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link href="/user/signup" className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Sign Up
                            </Link>

                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                            TaskForge
                        </h1>
                        <p className="text-xl sm:text-2xl text-blue-400 mb-4">
                            AI-Assisted Task Description Generator
                        </p>
                        <p className="text-lg text-neutral-300 mb-8 max-w-3xl mx-auto">
                            Get AI assistance to break down your project goals into clear, actionable task descriptions.
                            Perfect for junior PMs, developers, and indie hackers who need help structuring their work.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <Link
                                href="/user/signup"
                                className="bg-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/user/login"
                                className="border border-neutral-600 px-8 py-4 rounded-xl text-lg font-medium hover:border-neutral-500 hover:bg-neutral-900 transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Demo Account Info */}
                        <div className="max-w-md mx-auto">
                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="font-semibold text-white">Demo Account</span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-400">Email:</span>
                                        <span className="font-mono text-blue-400">testone@yopmail.com</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-400">Password:</span>
                                        <span className="font-mono text-blue-400">test12345</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-400">OTP:</span>
                                        <span className="font-mono text-green-400">9999</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-neutral-700">
                                    <p className="text-xs text-neutral-500">
                                        Use these credentials to explore the platform instantly
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Feature Preview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                                <Bot className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">AI Task Description</h3>
                            <p className="text-neutral-400">
                                Get AI help to describe and break down your project goals into clear, detailed task descriptions
                            </p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                                <Layers className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">Kanban Board</h3>
                            <p className="text-neutral-400">
                                Organize your AI-generated tasks in an intuitive drag & drop Kanban board interface
                            </p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-green-500/50 transition-colors">
                            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                                <CheckSquare className="text-green-400" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">Task Management</h3>
                            <p className="text-neutral-400">
                                Create, edit, and track your tasks with priority levels, due dates, and team collaboration
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 bg-neutral-900/30 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                            How It Works
                        </h2>
                        <p className="text-lg text-neutral-300">
                            Three simple steps to get AI help with your task descriptions
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">Create Your Project</h3>
                            <p className="text-neutral-300">
                                Manually create your project and describe your goal: "Build a blog with Next.js"
                                or "Create a task management app"
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">Get AI Task Suggestions</h3>
                            <p className="text-neutral-300">
                                Use AI to get suggestions for task descriptions based on your project goal.
                                The AI helps describe individual tasks, not generate complete workflows
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">Organize & Execute</h3>
                            <p className="text-neutral-300">
                                Arrange your tasks on the Kanban board, set priorities and due dates,
                                then track your progress as you work
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                            Built with Modern Tech
                        </h2>
                        <p className="text-lg text-neutral-300">
                            Powered by cutting-edge technologies for scalability and performance
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 text-center hover:border-neutral-700 transition-colors">
                            <div className="mb-4 flex justify-center">
                                <img src="/NextJs.png" alt="Logo" />
                            </div>
                            <div className="text-lg font-bold text-cyan-400 mb-2 className='w-10 h-10'">Next.js</div>
                            <p className="text-sm text-neutral-400">React Framework</p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 text-center hover:border-neutral-700 transition-colors">
                            <div className="mb-4 flex justify-center">
                                <img src="/FastAPI.png" alt="Logo" className='w-10 h-10' />
                            </div>
                            <div className="text-lg font-bold text-green-400 mb-2">FastAPI</div>
                            <p className="text-sm text-neutral-400">Python API</p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 text-center hover:border-neutral-700 transition-colors">
                            <div className="mb-4 flex justify-center">
                                <img src="/chatgpt.png" alt="Logo" className='w-10 h-10' />

                            </div>
                            <div className="text-lg font-bold text-emerald-400 mb-2">OpenAI</div>
                            <p className="text-sm text-neutral-400">AI Engine</p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 text-center hover:border-neutral-700 transition-colors">
                            <div className="mb-4 flex justify-center">
                                <img src="/mongodb.png" alt="Logo" className='w-10 h-10' />
                            </div>
                            <div className="text-lg font-bold text-green-500 mb-2">MongoDB</div>
                            <p className="text-sm text-neutral-400">Database</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                        Ready to Get AI Help with Your Tasks?
                    </h2>
                    <p className="text-lg text-neutral-300 mb-8">
                        Join developers and project managers who use TaskForge to get AI assistance in breaking down their project goals.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/user/signup"
                            className="bg-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Get Started Free
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/user/login"
                            className="border border-neutral-600 px-8 py-4 rounded-xl text-lg font-medium hover:border-neutral-500 hover:bg-neutral-900 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-neutral-900 border-t border-neutral-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Left side - TaskForge info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">TF</span>
                                </div>
                                <span className="text-xl font-bold text-white">TaskForge</span>
                            </div>
                            <p className="text-neutral-400 mb-4">
                                A personal learning project exploring AI-assisted task description generation.
                                Built to demonstrate how AI can help technical teams describe individual tasks more effectively.
                            </p>
                            <p className="text-sm text-neutral-500">
                                This is a learning project focused on AI integration with basic task management.
                                The AI specifically helps generate and improve task descriptions, not automated workflow creation.
                            </p>
                        </div>

                        {/* Right side - Creator info */}
                        <div className="text-center md:text-right">
                            <div className="mb-6">
                                <p className="text-blue-400 font-bold text-lg tracking-wider mb-2">
                                    CREATED BY ALVIN BOYS GEA
                                </p>
                                <p className="text-neutral-400 text-sm">
                                    Full-stack Developer & AI Enthusiast
                                </p>
                            </div>

                            <div className="flex justify-center md:justify-end gap-6">
                                <a
                                    href="https://www.linkedin.com/in/alvinboysgea"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-blue-400 transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin size={24} />
                                </a>
                                <a
                                    href="https://github.com/alvin0727"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-white transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github size={24} />
                                </a>
                                <a
                                    href="mailto:alvinboys2020@gmail.com"
                                    className="text-neutral-400 hover:text-red-400 transition-colors"
                                    aria-label="Email"
                                >
                                    <Mail size={24} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 mt-8 pt-8 text-center">
                        <p className="text-neutral-500 text-sm">
                            © 2025 TaskForge. A personal learning project by Alvin.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}