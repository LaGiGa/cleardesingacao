import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "../components/ui";
import { Link } from "react-router-dom";
import { Calendar, Droplets, MapPin, FileText, Loader2 } from "lucide-react";

export default function Home() {
    const assignments = useLiveQuery(async () => {
        const today = new Date().toISOString().split('T')[0];
        const cleanings = await db.cleaningAssignments
            .where('date')
            .aboveOrEqual(today)
            .limit(3)
            .toArray();

        const fields = await db.fieldServiceAssignments
            .where('date')
            .aboveOrEqual(today)
            .limit(3)
            .toArray();

        const combined = [
            ...cleanings.map(c => ({ ...c, type: 'cleaning' })),
            ...fields.map(f => ({ ...f, type: 'field' }))
        ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

        return combined;
    });

    const nextAssignment: any = assignments && assignments[0];
    const upcomingAssignments: any[] = assignments ? assignments.slice(1) : [];

    if (!assignments) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">Painel Principal</h1>
                    <p className="text-blue-100 font-medium opacity-90">Acompanhe suas designações e relatórios.</p>
                </div>
                {/* Decorative background circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-purple-400 opacity-20 blur-2xl"></div>
            </div>

            {/* Featured Assignment */}
            <div className="px-1">
                <h2 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4 ml-1">Destaque</h2>
                {nextAssignment ? (
                    <Card className={`border-0 overflow-hidden relative group ${nextAssignment.type === 'cleaning' ? 'shadow-blue-200/50 dark:shadow-blue-900/20' : 'shadow-purple-200/50 dark:shadow-purple-900/20'}`}>
                        <div className={`absolute top-0 left-0 w-2 h-full ${nextAssignment.type === 'cleaning' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${nextAssignment.type === 'cleaning' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                    {nextAssignment.type === 'cleaning' ? <Droplets className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                    {nextAssignment.type === 'cleaning' ? 'Limpeza' : 'Campo'}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize mb-1">
                                {format(parseISO(nextAssignment.date), "EEEE", { locale: ptBR })}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">
                                {format(parseISO(nextAssignment.date), "PPP", { locale: ptBR })}
                            </p>

                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Responsável</p>
                                <p className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-relaxed">
                                    {nextAssignment.type === 'cleaning'
                                        ? (Array.isArray(nextAssignment.designatedBrothers) ? nextAssignment.designatedBrothers.join(", ") : "Sem irmãos definidos")
                                        : nextAssignment.leader || "A definir"}
                                </p>
                                {nextAssignment.type === 'field' && nextAssignment.specialMarker && (
                                    <div className="mt-3 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-lg font-bold">
                                        ★ {nextAssignment.specialMarker}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center p-8 bg-gray-50 dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhuma designação próxima</p>
                    </div>
                )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4 px-1">
                <Link to="/cleaning" className="group relative overflow-hidden p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <Droplets className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-bold text-gray-900 dark:text-white text-lg">Limpeza</span>
                    <p className="text-xs text-gray-500 mt-1">Ver escala completa</p>
                </Link>

                <Link to="/field" className="group relative overflow-hidden p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 dark:bg-purple-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <MapPin className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-bold text-gray-900 dark:text-white text-lg">Campo</span>
                    <p className="text-xs text-gray-500 mt-1">Ver dirigentes</p>
                </Link>

                <Link to="/reports" className="col-span-2 group relative overflow-hidden p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-2 group-hover:text-blue-600 transition-colors" />
                    <span className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Acessar Relatórios</span>
                </Link>
            </div>

            {/* Upcoming List */}
            {upcomingAssignments && upcomingAssignments.length > 0 && (
                <div className="px-1">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h2 className="text-sm uppercase tracking-wider text-gray-500 font-bold">Próximas</h2>
                    </div>
                    <div className="space-y-3">
                        {upcomingAssignments.map((item: any) => (
                            <Link to={item.type === 'cleaning' ? '/cleaning' : '/field'} key={`${item.type}-${item.id}`}>
                                <Card className="flex items-center p-4 hover:shadow-md transition-shadow cursor-pointer border-transparent bg-white/50 dark:bg-slate-900/50">
                                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${item.type === 'cleaning' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-500 dark:bg-purple-900/20'}`}>
                                        <div className="text-center leading-none">
                                            <span className="block text-[10px] font-bold uppercase opacity-60">{format(parseISO(item.date), "MMM", { locale: ptBR })}</span>
                                            <span className="block text-lg font-bold">{format(parseISO(item.date), "dd")}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate capitalize">
                                            {format(parseISO(item.date), "EEEE", { locale: ptBR })}
                                        </h4>
                                        <p className="text-sm text-gray-500 truncate">
                                            {item.type === 'cleaning'
                                                ? (Array.isArray(item.designatedBrothers) ? item.designatedBrothers.join(", ") : "Sem irmãos")
                                                : item.leader || "A definir"}
                                        </p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'cleaning' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
