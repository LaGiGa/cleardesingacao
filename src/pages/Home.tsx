import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Link } from "react-router-dom";
import { Calendar, Droplets, MapPin, FileText } from "lucide-react";

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

    if (!assignments) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Próximas Designações</h1>
            </div>

            <div className="grid gap-4">
                {assignments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nenhuma designação futura encontrada.</p>
                )}
                {assignments.map((item: any) => (
                    <Card key={`${item.type}-${item.id}`} className={item.type === 'cleaning' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(parseISO(item.date), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'cleaning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                    {item.type === 'cleaning' ? 'Limpeza' : 'Campo'}
                                </span>
                            </div>
                            <CardTitle className="text-lg capitalize">
                                {format(parseISO(item.date), "EEEE", { locale: ptBR })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {item.type === 'cleaning' ? (
                                <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <Droplets className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-500">Irmãos:</p>
                                        <p>{item.designatedBrothers.join(", ")}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <MapPin className="w-5 h-5 text-purple-500 mt-1 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-500">Dirigente:</p>
                                        <p>{item.leader}</p>
                                        {item.specialMarker && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-md font-medium">
                                                {item.specialMarker}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link to="/cleaning" className="flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                        <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Limpeza</span>
                </Link>
                <Link to="/field" className="flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-2">
                        <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Campo</span>
                </Link>
                <Link to="/reports" className="col-span-2 flex items-center justify-center p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl shadow-md transition hover:opacity-90 active:scale-[0.98]">
                    <FileText className="w-5 h-5 mr-2" />
                    <span className="font-medium">Relatórios</span>
                </Link>
            </div>
        </div>
    );
}
