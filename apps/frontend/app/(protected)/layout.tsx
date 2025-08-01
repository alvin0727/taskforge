import AuthProvider from "./providers/AuthProvider";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-neutral-950">
        <Sidebar />
        <div className="flex flex-col flex-1 min-h-screen">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}
