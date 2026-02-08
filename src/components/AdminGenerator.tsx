import { useState, useEffect } from "react";
import { db, type CleaningAssignment, type FieldServiceAssignment } from "../db";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "./ui";
import { format, addMonths, eachDayOfInterval, startOfMonth, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Loader2 } from "lucide-react";

export function AdminGenerator() {
    const [type, setType] = useState<'cleaning' | 'field'>('cleaning');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [months, setMonths] = useState(1);
    const [names, setNames] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);

    // New state for week selection
    const [availableWeeks, setAvailableWeeks] = useState<{ start: Date, end: Date, label: string, selected: boolean }[]>([]);

    useEffect(() => {
        loadRecentPatterns();
    }, [type]);

    useEffect(() => {
        calculateAvailableWeeks();
    }, [startDate, months]);

    const calculateAvailableWeeks = () => {
        const referenceDate = parseISO(startDate);
        const monthStart = startOfMonth(referenceDate);
        // Align start to the Monday of the week containing the 1st of the month
        const start = startOfWeek(monthStart, { weekStartsOn: 1 });
        const end = addMonths(monthStart, months);
        const days = eachDayOfInterval({ start, end });

        // Group by week (Monday to Sunday)
        const weeks: { start: Date, end: Date, label: string, selected: boolean }[] = [];
        let currentWeek: Date[] = [];

        days.forEach((day) => {
            // 1 = Monday, 0 = Sunday.
            // date-fns getDay: 0=Sun, 1=Mon... 6=Sat.
            // We want chunks from Mon to Sun.
            const dayOfWeek = day.getDay();

            // If it's Monday and we have a previous week accumulating, push it?
            // Actually simpler: just iterate and check if it's the start of a week.
            // Let's use isMonday to start a new block?
            // But the month might start on Wednesday.

            // Approach: Iterate all days.
            // If currentWeek is empty, start it.
            // Add day.
            // If day is Sunday, end week, push to weeks, clear currentWeek.

            currentWeek.push(day);
            if (dayOfWeek === 0) { // Sunday
                const wStart = currentWeek[0];
                const wEnd = currentWeek[currentWeek.length - 1];
                const label = `${format(wStart, "dd/MM")} a ${format(wEnd, "dd/MM")}`;
                weeks.push({ start: wStart, end: wEnd, label, selected: false });
                currentWeek = [];
            }
        });

        // Push partial week if exists (end of period)
        if (currentWeek.length > 0) {
            const wStart = currentWeek[0];
            const wEnd = currentWeek[currentWeek.length - 1];
            const label = `${format(wStart, "dd/MM")} a ${format(wEnd, "dd/MM")}`;
            weeks.push({ start: wStart, end: wEnd, label, selected: false });
        }

        setAvailableWeeks(weeks);
    };

    const toggleWeek = (index: number) => {
        const updated = [...availableWeeks];
        updated[index].selected = !updated[index].selected;
        setAvailableWeeks(updated);
    }

    const loadRecentPatterns = async () => {
        try {
            if (type === 'cleaning') {
                const recent = await db.cleaningAssignments.orderBy('date').reverse().limit(20).toArray();
                const uniqueGroups = new Set<string>();
                recent.forEach(r => {
                    const groupStr = r.designatedBrothers.join(', ');
                    if (groupStr) uniqueGroups.add(groupStr);
                });
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
        const generated: any[] = [];
        const nameList = names.split('\n').map(n => n.trim()).filter(Boolean);

        // Iterate ONLY selected weeks
        const selectedWeeks = type === 'cleaning' ? availableWeeks.filter(w => w.selected) : [];

        // If no week selected, maybe warn user? or generate for all?
        // Let's assume if none selected, generate for all (fallback) or nothing.
        // Better: require selection if cleaning.
        // For field service, user might want standard Sunday logic.

        // Actually, user Requirements said: "Cleaning... admin select specific weeks... assignments are Wed and Sun".
        // Field service logic wasn't explicitly changed, assuming it stays Sunday only? 
        // Or should we apply this to both? The request specifically mentioned "Cleaning".
        // Let's apply week selection to BOTH for consistency, but for Field maybe only pick Sundays.
        // User: "entrega... domingo". Field Service usually is daily or weekends.
        // Let's stick to the request: "Cleaning assignments... Wed and Sun".
        // For Field, let's keep it simply "Sundays" within selected weeks? Or all days?
        // Existing logic was "Sundays". Let's keep Field as Sundays within selected weeks.

        const weeksToProcess = selectedWeeks.length > 0 ? selectedWeeks : availableWeeks;

        // Refactored Loop to ensure "Same Group per Week" logic

        let groupIndex = 0;

        for (const week of weeksToProcess) {
            const daysInWeek = eachDayOfInterval({ start: week.start, end: week.end });

            // Prepare group for this week
            let currentGroup: string[] = [];
            let currentLeader = "A definir";

            if (nameList.length > 0) {
                const rawName = nameList[groupIndex % nameList.length];
                if (type === 'cleaning') {
                    currentGroup = rawName.split(',').map(s => s.trim());
                } else {
                    currentLeader = rawName;
                }
            }

            // Find applicable days
            const targetDays = daysInWeek.filter(d => {
                const dw = d.getDay();
                if (type === 'cleaning') return dw === 3 || dw === 0; // Wed, Sun
                return dw === 0; // Sun for Field
            });

            if (targetDays.length > 0) {
                // Only increment group index if we actually generated assignments for this week
                groupIndex++;
            }

            for (const date of targetDays) {
                const dateStr = format(date, 'yyyy-MM-dd');
                const monthLabel = format(date, 'MMMM', { locale: ptBR });
                const dayText = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

                if (type === 'cleaning') {
                    generated.push({
                        date: dateStr,
                        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                        dayText,
                        designatedBrothers: currentGroup,
                        type: 'cleaning'
                    } as CleaningAssignment & { type: string });
                } else {
                    generated.push({
                        date: dateStr,
                        dayText,
                        leader: currentLeader,
                        type: 'field'
                    } as FieldServiceAssignment & { type: string });
                }
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

                {/* Week Selection UI */}
                {type === 'cleaning' && (
                    <div className="space-y-2 border p-3 rounded-md bg-slate-50 dark:bg-slate-900/50">
                        <Label className="text-xs uppercase tracking-wider text-slate-500">Selecione as Semanas Responsáveis</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {availableWeeks.map((week, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`week-${idx}`}
                                        checked={week.selected}
                                        onChange={() => toggleWeek(idx)}
                                        className="rounded border-gray-300 dark:border-slate-700"
                                    />
                                    <label htmlFor={`week-${idx}`} className="text-sm cursor-pointer select-none">
                                        Semana: {week.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Para Limpeza: Serão geradas Quartas e Domingos das semanas marcadas.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>
                        {type === 'cleaning' ? 'Lista de Grupos/Irmãos (um grupo por semana)' : 'Lista de Dirigentes (um por semana)'}
                    </Label>
                    <textarea
                        className="w-full p-2 border rounded-md min-h-[100px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-gray-100"
                        placeholder={type === 'cleaning' ? "Grupo A\nGrupo B" : "José\nCarlos"}
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        Os nomes serão distribuídos sequencialmente para cada <strong>Semana Selecionada</strong>.
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
                                                const newNames = e.target.value.split(',').map((s: string) => s.trim());
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
