import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { toPng } from 'html-to-image';
import { Button } from "../components/ui";
import { Download, Share2 } from "lucide-react";

export default function Reports() {
    const [activeTab, setActiveTab] = useState<'cleaning' | 'field'>('cleaning');
    const reportRef = useRef<HTMLDivElement>(null);

    const data = useLiveQuery(async () => {
        const group = await db.groupConfig.orderBy('id').first();
        const fieldConfig = await db.fieldServiceConfig.orderBy('id').first();
        const cleaning = await db.cleaningAssignments.orderBy('date').toArray();
        const field = await db.fieldServiceAssignments.orderBy('date').toArray();
        return { group, fieldConfig, cleaning, field };
    });

    if (!data) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>;

    const handleExport = async () => {
        if (reportRef.current) {
            try {
                // Wait for fonts to load? usually okay.
                const dataUrl = await toPng(reportRef.current, { quality: 0.95, backgroundColor: 'white', pixelRatio: 2 });
                const link = document.createElement('a');
                link.download = `relatorio-${activeTab}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Failed to export image", err);
                alert("Erro ao gerar imagem.");
            }
        }
    };

    const handleShare = async () => {
        if (reportRef.current) {
            try {
                const dataUrl = await toPng(reportRef.current, { quality: 0.95, backgroundColor: 'white', pixelRatio: 2 });
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `relatorio-${activeTab}.png`, { type: 'image/png' });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Relatório de Designações',
                        files: [file]
                    });
                } else {
                    // Fallback to download if share not supported
                    handleExport();
                }
            } catch (err) {
                console.error("Failed to share", err);
                alert("Compartilhamento não suportado ou cancelado.");
            }
        }
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Relatórios</h1>
            </div>

            <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                    onClick={() => setActiveTab('cleaning')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'cleaning' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Limpeza
                </button>
                <button
                    onClick={() => setActiveTab('field')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'field' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Saída de Campo
                </button>
            </div>

            <div className="overflow-x-auto border rounded-xl bg-gray-50/50 shadow-inner p-4">
                <div className="flex justify-center min-w-max">
                    <div ref={reportRef} className="bg-white min-w-[700px] w-[800px] shadow-lg text-slate-900">
                        {activeTab === 'cleaning' ? (
                            <CleaningReportTemplate data={data} />
                        ) : (
                            <FieldReportTemplate data={data} />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleExport} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PNG
                </Button>
                <Button onClick={handleShare} className="w-full bg-green-600 hover:bg-green-700">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                </Button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-4">
                Dica: Em computadores, use "Baixar PNG". No celular, tente "Compartilhar" para enviar direto no WhatsApp.
            </p>
        </div>
    );
}

function CleaningReportTemplate({ data }: { data: any }) {
    const { group, cleaning } = data;

    // Process cleaning data to manage rowspan for Month column
    const processedCleaning: any[] = [];
    cleaning.forEach((curr: any, index: number) => {
        const prev = cleaning[index - 1];
        const isFirstOfMonth = index === 0 || prev.monthLabel !== curr.monthLabel;
        let rowSpan = 1;

        if (isFirstOfMonth) {
            for (let i = index + 1; i < cleaning.length; i++) {
                if (cleaning[i].monthLabel === curr.monthLabel) {
                    rowSpan++;
                } else {
                    break;
                }
            }
        }

        processedCleaning.push({
            ...curr,
            isFirstOfMonth,
            rowSpan: isFirstOfMonth ? rowSpan : 0
        });
    });

    return (
        <div className="flex flex-col w-full text-slate-900 bg-white pb-10">
            {/* Header */}
            <div className="bg-[#3672b1] text-white p-4 text-center font-bold text-xl uppercase tracking-wide">
                Programação LIMPEZA dos BANHEIROS e ORGANIZAÇÃO DO DEPÓSITO
            </div>
            <div className="bg-[#2c5d91] text-white px-8 py-2 flex justify-between font-bold text-lg border-t border-white/20">
                <span>{group?.name || "Nome do Grupo"}</span>
                <span>{group?.semesterYear || "Período"}</span>
            </div>

            {/* Subheader info */}
            <div className="px-8 py-6 space-y-1 text-sm font-semibold text-slate-800">
                <p>Superintendente de Grupo: <span className="font-normal">{group?.superintendent}</span></p>
                <p>Ajudante: <span className="font-normal">{group?.assistant}</span></p>
            </div>

            {/* Table */}
            <div className="px-8 pb-6 w-full">
                <table className="w-full border-collapse border border-slate-400 text-sm shadow-sm">
                    <thead>
                        <tr className="bg-[#3672b1] text-white">
                            <th className="border border-slate-300 p-3 w-1/6 font-bold uppercase text-xs tracking-wider">Mês</th>
                            <th className="border border-slate-300 p-3 w-2/6 font-bold uppercase text-xs tracking-wider">Dia / Data</th>
                            <th className="border border-slate-300 p-3 w-3/6 font-bold uppercase text-xs tracking-wider">Irmãos Designados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedCleaning.map((item: any, idx: number) => (
                            <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                                {item.isFirstOfMonth && (
                                    <td
                                        rowSpan={item.rowSpan}
                                        className="border border-slate-400 p-2 text-center font-bold text-[#3672b1] bg-blue-50/50 align-middle capitalize text-base"
                                    >
                                        {item.monthLabel}
                                    </td>
                                )}
                                <td className={`border border-slate-400 p-3 text-center font-medium text-slate-700 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                                    {item.dayText}
                                </td>
                                <td className={`border border-slate-400 p-3 text-center font-medium text-slate-800 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                                    {item.designatedBrothers.join(", ")}
                                    {item.observation && <div className="text-xs text-gray-500 mt-1 italic">({item.observation})</div>}
                                </td>
                            </tr>
                        ))}
                        {processedCleaning.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">Nenhuma designação de limpeza encontrada para este período.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-8 pt-2 text-[10px] text-gray-400 text-center">
                Gerado automaticamente pelo App Designações
            </div>
        </div>
    );
}

function FieldReportTemplate({ data }: { data: any }) {
    const { group, fieldConfig, field } = data;

    return (
        <div className="flex flex-col w-full text-slate-900 bg-white pb-10">
            {/* Header */}
            <div className="bg-[#a825bd] text-white p-4 text-center font-bold text-xl uppercase">
                Programação Saída de Campo {new Date().getFullYear()} - {group?.name}
            </div>

            {/* Subheader info */}
            <div className="p-6 space-y-2 text-sm font-bold text-slate-800">
                <p>Superintendente de Grupo: <span className="font-normal">{group?.superintendent}</span></p>
                <p>Ajudante do Superintendente de Grupo: <span className="font-normal">{group?.assistant}</span></p>
                <div className="pt-2">
                    <p>Local de Saída de Campo e horário: <span className="font-normal">{fieldConfig?.location}</span></p>
                    <p>Horário consideração: <span className="font-normal">{fieldConfig?.meetingTime}</span></p>
                </div>
            </div>

            {/* Table */}
            <div className="px-6 pb-6 w-full">
                <table className="w-full border-collapse border border-slate-400 text-sm">
                    <thead>
                        <tr className="bg-[#a825bd] text-white">
                            <th className="border border-slate-300 p-3 w-3/5">Dia da designação</th>
                            <th className="border border-slate-300 p-3 w-2/5">Dirigente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {field.map((item: any, idx: number) => {
                            const isSpecial = item.specialMarker?.toLowerCase().includes("assembleia") || item.specialMarker?.toLowerCase().includes("congresso");
                            return (
                                <tr key={item.id} className={isSpecial ? "bg-[#9ccbf3]" : (idx % 2 === 0 ? "bg-[#f4e6f6]" : "bg-white")}>
                                    <td className="border border-slate-400 p-2 text-center font-medium">
                                        {item.dayText}
                                    </td>
                                    <td className={`border border-slate-400 p-2 text-center ${isSpecial ? "font-bold text-slate-900" : "font-medium"}`}>
                                        {item.specialMarker ? item.specialMarker : item.leader}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
