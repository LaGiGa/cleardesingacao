import { useState, useEffect } from "react";
import { db, type CleaningAssignment, type FieldServiceAssignment } from "../db";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "./ui";
import { format, addMonths, eachDayOfInterval, startOfMonth, isSunday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Loader2 } from "lucide-react";

export function AdminGenerator() {
    const [type, setType] = useState<'cleaning' | 'field'>('cleaning');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [months, setMonths] = useState(3);
    const [names, setNames] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);

    useEffect(() => {
        loadRecentPatterns();
    }, [type]);

    const loadRecentPatterns = async () => {
        try {
            if (type === 'cleaning') {
                // Get unique last used groups
                const recent = await db.cleaningAssignments.orderBy('date').reverse().limit(20).toArray();
                const uniqueGroups = new Set<string>();
                recent.forEach(r => {
                    const groupStr = r.designatedBrothers.join(', ');
                    if (groupStr) uniqueGroups.add(groupStr);
                });
                // Convert Set to Array and then join with newline
                setNames(Array.from(uniqueGroups).reverse().join('\n'));
            } else {
                const recent = await db.fieldServiceAssignments.orderBy('date').reverse().limit(20).toArray();
                const uniqueLeaders = new Set<string>();
                recent.forEach(r => {
                    if (r.leader && r.leader !== 'A definir') uniqueLeaders.add(r.leader);
                });
                setNames(Array.from(uniqueLeaders).reverse().join('\n'));
            }
        } catch (e) {
            console.error("Error loading patterns", e);
        }
    };

    const handleGeneratePreview = () => {
        const start = startOfMonth(parseISO(startDate));
        const end = addMonths(start, months);

        // Get all dates in range
        const allDays = eachDayOfInterval({ start, end });

        // Filter Sundays (and Wednesdays for cleaning? User said "standard is Sunday", implies maybe only Sundays)
        // Usually Cleaning is Wed/Sun or Sat/Sun. Let's stick to Sundays based on request "noss padrão é domingo".
        // But seed data had Wednesdays too. Let's just do Sundays for now as per request.
        // Wait, cleaning usually has mid-week too. "Grupo Arno 73" might have specific days.
        // The user complained "showing Saturdays, but our standard is Sunday".
        // I will generate for SUNDAYS only for now, or allow selecting days?
        // Let's stick to simple: Generate Sundays.

        const sundays = allDays.filter(day => isSunday(day));

        const generated = [];
        const nameList = names.split('\n').map(n => n.trim()).filter(Boolean);

        let nameIndex = 0;

        for (const date of sundays) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const monthLabel = format(date, 'MMMM', { locale: ptBR });
            const dayText = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

            if (type === 'cleaning') {
                // For cleaning, we might want a group of names.
                // If the user provides lines like:
                // Group A
                // Group B
                // We cycle them.

                let assigned: string[] = [];
                if (nameList.length > 0) {
                    // If names are provided, take one line per Sunday? Or rotating groups?
                    // Let's assume one line = one group description or list of names.
                    assigned = nameList[nameIndex % nameList.length].split(',').map(s => s.trim());
                    nameIndex++;
                }

                generated.push({
                    date: dateStr,
                    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                    dayText,
                    designatedBrothers: assigned,
                    type: 'cleaning'
                } as CleaningAssignment & { type: string });
            } else {
                // Field Service
                let leader = "A definir";
                if (nameList.length > 0) {
                    leader = nameList[nameIndex % nameList.length];
                    nameIndex++;
                }

                generated.push({
                    date: dateStr,
                    dayText,
                    leader,
                    type: 'field'
                } as FieldServiceAssignment & { type: string });
            }
        }
        setPreview(generated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (type === 'cleaning') {
                await db.cleaningAssignments.bulkAdd(preview.map(({ type, ...rest }) => rest));
            } else {
                await db.fieldServiceAssignments.bulkAdd(preview.map(({ type, ...rest }) => rest));
            }
            alert("Designações geradas com sucesso!");
            setPreview([]);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar. Verifique se já existem datas duplicadas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Gerador de Designações
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                            className="w-full p-2 border rounded-md bg-white dark:bg-slate-950 dark:border-slate-800"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'cleaning' | 'field')}
                        >
                            <option value="cleaning">Limpeza</option>
                            <option value="field">Campo</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Iniciar em (Mês/Ano)</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Duração (Meses)</Label>
                    <Input
                        type="number"
                        min="1"
                        max="12"
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                    />
                </div>

                <div className="space-y-2">
                    <Label>
                        {type === 'cleaning' ? 'Lista de Grupos/Irmãos (um grupo por linha)' : 'Lista de Dirigentes (um por linha)'}
                    </Label>
                    <textarea
                        className="w-full p-2 border rounded-md min-h-[100px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-gray-100"
                        placeholder={type === 'cleaning' ? "João, Maria\nPedro, Tiago" : "José\nCarlos"}
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        Deixe em branco para criar datas vazias. Se preenchido, os nomes serão rotacionados a cada Domingo.
                    </p>
                </div>

                <Button onClick={handleGeneratePreview} className="w-full" disabled={loading}>
                    Gerar Prévia
                </Button>

                {preview.length > 0 && (
                    <div className="mt-4 space-y-2 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Prévia ({preview.length} itens):</h3>
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Confirmar e Salvar
                            </Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm dark:bg-slate-900 dark:border-slate-800">
                            {preview.map((item, i) => (
                                <div key={i} className="flex flex-col py-2 border-b last:border-0 border-gray-200 dark:border-slate-800 gap-1">
                                    <span className="text-gray-500 text-xs dark:text-gray-400">{format(parseISO(item.date), "dd/MM/yyyy")} - {item.dayText.split(',')[0]}</span>
                                    {type === 'cleaning' ? (
                                        <Input
                                            value={item.designatedBrothers.join(', ')}
                                            onChange={(e) => {
                                                const newNames = e.target.value.split(',').map(s => s.trim());
                                                setPreview(prev => {
                                                    const updated = [...prev];
                                                    updated[i] = { ...updated[i], designatedBrothers: newNames };
                                                    return updated;
                                                });
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    ) : (
                                        <Input
                                            value={item.leader}
                                            onChange={(e) => {
                                                setPreview(prev => {
                                                    const updated = [...prev];
                                                    updated[i] = { ...updated[i], leader: e.target.value };
                                                    return updated;
                                                });
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
