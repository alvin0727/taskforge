"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function BoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  // Simulasi: tampilkan board task jika ada projectId
  if (!projectId) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <h2 className="text-xl font-bold mb-2">Board Overview</h2>
        <p>Pilih project dari sidebar untuk melihat board task.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-500 mb-4">Task Board Project: {projectId}</h2>
      {/* Di sini render komponen board task project sesuai projectId */}
      <div className="bg-neutral-800 rounded-lg p-6 shadow">
        <p className="text-neutral-300">Daftar task untuk project <span className="font-bold">{projectId}</span> akan tampil di sini.</p>
        {/* TODO: Integrasi komponen board task project */}
      </div>
    </div>
  );
}
