import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Droplets, MapPin, Settings, FileText } from "lucide-react";

import { ModeToggle } from "./components/mode-toggle";

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: "Início", path: "/" },
        { icon: Droplets, label: "Limpeza", path: "/cleaning" },
        { icon: MapPin, label: "Campo", path: "/field" },
        { icon: FileText, label: "Relat.", path: "/reports" },
        { icon: Settings, label: "Config.", path: "/settings" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="fixed top-4 right-4 z-50">
                <ModeToggle />
            </div>
            <main className="flex-1 container mx-auto px-4 py-6 max-w-md pb-24">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-blue-50 dark:bg-slate-800' : ''}`}>
                                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] mt-0.5 font-medium tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
