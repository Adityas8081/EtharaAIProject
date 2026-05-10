import { Navbar } from "@/components/navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
