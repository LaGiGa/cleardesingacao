import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type CleaningAssignment } from "../db";
import { useAdmin } from "../hooks/useAdmin";
import { Button, Input, Card, CardContent, Label } from "../components/ui";
import { Plus, Trash2, Edit2, Search, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Cleaning() {
    const { isAdmin } = useAdmin();
    const [search, setSearch] = useState("");
    const [editingItem, setEditingItem] = useState<CleaningAssignment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assignments = useLiveQuery(async () => {
        let all = await db.cleaningAssignments.orderBy('date').toArray();
        if (search) {
            all = all.filter(c =>
                c.designatedBrothers.some(n => n.toLowerCase().includes(search.toLowerCase())) ||
                c.monthLabel.toLowerCase().includes(search.toLowerCase())
            );
        }
        return all;
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            if (!editingItem.date) return alert("Data obrigatória");
            if (editingItem.designatedBrothers.length === 0) return alert("Pelo menos 1 irmão");

            // Use current values or defaults
            const finalItem = { ...editingItem };

            if (finalItem.id) {
                await db.cleaningAssignments.put(finalItem);
            } else {
                const { id, ...rest } = finalItem;
                await db.cleaningAssignments.add(rest as any);
            }
            setEditingItem(null);
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Excluir designação?")) {
            await db.cleaningAssignments.delete(id);
        }
    };

    const openNew = () => {
        const today = new Date().toISOString().split('T')[0];
        const dateObj = new Date();
        setEditingItem({
            id: 0,
            date: today,
            monthLabel: format(dateObj, "MMMM", { locale: ptBR }),
            dayText: format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }),
            designatedBrothers: [],
            observation: ""
        } as CleaningAssignment);
        setIsModalOpen(true);
    };

    if (!assignments) return <div className="p-8 text-center">Carregando...</div>;

    const grouped = assignments.reduce((acc: any, curr) => {
        const month = curr.monthLabel;
        if (!acc[month]) acc[month] = [];
        acc[month].push(curr);
        return acc;
    }, {});

    return (
        <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 shadow-sm rounded-xl">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Limpeza</h1>
                {isAdmin && <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova</Button>}
            </div>

            <div className="relative px-1">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar irmão ou mês..."
                    className="pl-9 bg-white dark:bg-slate-900 dark:text-gray-100 dark:border-slate-800"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-6">
                {Object.keys(grouped).length === 0 && <p className="text-center text-gray-500 mt-8">Nenhuma designação encontrada.</p>}
                {Object.entries(grouped).map(([month, items]: [string, any]) => (
                    <div key={month} className="space-y-2">
                        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-2 sticky top-[4.5rem] bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-sm py-1 z-0">{month}</h2>
                        {items.map((item: CleaningAssignment) => (
                            <Card key={item.id} className="relative overflow-hidden group hover:shadow-lg transition-all border-l-4 border-l-blue-500 bg-white dark:bg-slate-900">
                                <CardContent className="p-4 flex items-center gap-4">
                                    {/* Date Badge */}
                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                                        <span className="text-xs font-bold uppercase">{format(parseISO(item.date), "MMM", { locale: ptBR })}</span>
                                        <span className="text-xl font-bold leading-none">{format(parseISO(item.date), "dd")}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold capitalize text-gray-400 dark:text-gray-500 mb-0.5">
                                            {format(parseISO(item.date), "EEEE", { locale: ptBR })}
                                        </p>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight truncate">
                                            {item.designatedBrothers.join(", ")}
                                        </h3>
                                        {item.observation && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                                {item.observation}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {isAdmin && (
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-lg">{editingItem.id ? 'Editar' : 'Nova'} Designação</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-4">
                            <div className="space-y-1">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={editingItem.date}
                                    onChange={e => {
                                        const d = e.target.value;
                                        if (d) {
                                            const dateObj = parseISO(d);
                                            const dt = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
                                            const ml = format(dateObj, "MMMM", { locale: ptBR });
                                            setEditingItem(prev => ({ ...prev!, date: d, dayText: dt, monthLabel: ml }));
                                        } else {
                                            setEditingItem(prev => ({ ...prev!, date: d }));
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Rótulo Mês (ex: Setembro)</Label>
                                <Input
                                    value={editingItem.monthLabel}
                                    onChange={e => setEditingItem({ ...editingItem, monthLabel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Texto do Dia</Label>
                                <Input
                                    value={editingItem.dayText}
                                    onChange={e => setEditingItem({ ...editingItem, dayText: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Irmãos (separe por vírgula)</Label>
                                <Input
                                    value={editingItem.designatedBrothers.join(", ")}
                                    onChange={e => setEditingItem({ ...editingItem, designatedBrothers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    placeholder="João, Maria, José"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Observação</Label>
                                <Input
                                    value={editingItem.observation || ''}
                                    onChange={e => setEditingItem({ ...editingItem, observation: e.target.value })}
                                />
                            </div>
                            <div className="pt-2">
                                <Button type="submit" className="w-full">Salvar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
