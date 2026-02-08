import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type FieldServiceAssignment } from "../db";
import { useAdmin } from "../hooks/useAdmin";
import { Button, Input, Card, CardContent, Label } from "../components/ui";
import { Plus, Trash2, Edit2, Search, X, Flag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FieldService() {
    const { isAdmin } = useAdmin();
    const [search, setSearch] = useState("");
    const [editingItem, setEditingItem] = useState<FieldServiceAssignment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assignments = useLiveQuery(async () => {
        let all = await db.fieldServiceAssignments.orderBy('date').toArray();
        if (search) {
            all = all.filter(c =>
                c.leader.toLowerCase().includes(search.toLowerCase()) ||
                (c.specialMarker && c.specialMarker.toLowerCase().includes(search.toLowerCase()))
            );
        }
        return all;
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            if (!editingItem.date) return alert("Data obrigatória");
            if (!editingItem.leader && !editingItem.specialMarker) return alert("Dirigente ou Marcador Especial obrigatório");

            const finalItem = { ...editingItem };
            if (finalItem.id) {
                await db.fieldServiceAssignments.put(finalItem);
            } else {
                const { id, ...rest } = finalItem;
                await db.fieldServiceAssignments.add(rest as any);
            }
            setEditingItem(null);
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Excluir designação?")) {
            await db.fieldServiceAssignments.delete(id);
        }
    };

    const openNew = () => {
        const today = new Date().toISOString().split('T')[0];
        const dateObj = new Date();
        setEditingItem({
            id: 0,
            date: today,
            dayText: format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }),
            leader: "",
            specialMarker: ""
        } as FieldServiceAssignment);
        setIsModalOpen(true);
    };

    if (!assignments) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 shadow-sm rounded-xl">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Saída de Campo</h1>
                {isAdmin && <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova</Button>}
            </div>

            <div className="relative px-1">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar dirigente..."
                    className="pl-9 bg-white dark:bg-slate-900 dark:text-gray-100 dark:border-slate-800"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                {assignments.length === 0 && <p className="text-center text-gray-500 mt-8">Nenhuma designação encontrada.</p>}
                {assignments.map((item) => {
                    const isSpecial = !!item.specialMarker;
                    return (
                        <Card key={item.id} className={`relative overflow-hidden group hover:shadow-lg transition-all border-l-4 ${isSpecial ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-l-purple-500 bg-white dark:bg-slate-900'}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                {/* Date Badge */}
                                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${isSpecial ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                    <span className="text-xs font-bold uppercase">{format(parseISO(item.date), "MMM", { locale: ptBR })}</span>
                                    <span className="text-xl font-bold leading-none">{format(parseISO(item.date), "dd")}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold capitalize text-gray-400 dark:text-gray-500 mb-0.5">
                                        {format(parseISO(item.date), "EEEE", { locale: ptBR })}
                                    </p>

                                    {isSpecial ? (
                                        <div className="flex items-center text-amber-700 dark:text-amber-500 font-bold text-lg leading-tight">
                                            <Flag className="w-4 h-4 mr-2 shrink-0" />
                                            {item.specialMarker}
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-gray-800 dark:text-white font-bold text-lg leading-tight">
                                            {item.leader}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {isAdmin && (
                                    <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
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
                                            setEditingItem(prev => ({ ...prev!, date: d, dayText: dt }));
                                        } else {
                                            setEditingItem(prev => ({ ...prev!, date: d }));
                                        }
                                    }}
                                    required
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
                                <Label>Dirigente</Label>
                                <Input
                                    value={editingItem.leader}
                                    onChange={e => setEditingItem({ ...editingItem, leader: e.target.value })}
                                    placeholder="Nome do irmão"
                                />
                            </div>
                            <div className="space-y-1 bg-amber-50 p-3 rounded-md border border-amber-100">
                                <Label className="text-amber-800">Marcador Especial (Opcional)</Label>
                                <Input
                                    value={editingItem.specialMarker || ''}
                                    onChange={e => setEditingItem({ ...editingItem, specialMarker: e.target.value })}
                                    placeholder="Ex: Assembleia de Circuito"
                                    className="bg-white"
                                />
                                <p className="text-xs text-amber-700 mt-1">Se preenchido, destaca a linha.</p>
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
