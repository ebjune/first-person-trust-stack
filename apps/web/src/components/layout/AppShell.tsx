import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ManagerNav } from "./ManagerNav";

export function AppShell() {
  const { session, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/pnm" className="flex items-center gap-2">
            <span className="text-indigo-600 font-bold text-lg tracking-tight">FPS</span>
            <span className="text-slate-500 text-sm hidden sm:block">
              First Person Trust Stack
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {session && (
              <>
                <span className="text-xs text-slate-500 hidden md:block truncate max-w-xs" title={session.did}>
                  {session.did}
                </span>
                <button
                  onClick={() => void logout()}
                  className="text-sm text-slate-600 hover:text-red-600 transition-colors px-3 py-1.5 rounded border border-slate-200 hover:border-red-200"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Manager tabs */}
      <ManagerNav />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-400">
        <a href="https://www.fpndtg.com" target="_blank" rel="noreferrer" className="hover:text-indigo-500">
          fpndtg.com
        </a>
        {" · "}
        First Person Trust Stack — Phase 1 Emulator
      </footer>
    </div>
  );
}
