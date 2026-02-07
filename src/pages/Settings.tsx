import { useState, useEffect } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label } from "../components/ui";
import { Lock, Unlock, Download, Upload, Trash2, Save } from "lucide-react";
import { db, type GroupConfig, type FieldServiceConfig } from "../db";
import { AdminGenerator } from "../components/AdminGenerator";

export default function Settings() {
    const { isAdmin, login, logout } = useAdmin();
    const [pin, setPin] = useState("");
    const [groupConfig, setGroupConfig] = useState<GroupConfig | null>(null);
    const [fieldConfig, setFieldConfig] = useState<FieldServiceConfig | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const g = await db.groupConfig.orderBy('id').first();
        const f = await db.fieldServiceConfig.orderBy('id').first();
        setGroupConfig(g || null);
        setFieldConfig(f || null);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(pin)) {
            setPin("");
        } else {
            alert("PIN incorreto (Tente 0000 ou 1914)");
        }
    };

    const handleSaveGroup = async () => {
        if (groupConfig && groupConfig.id) {
            await db.groupConfig.put(groupConfig);
            alert("Configurações do Grupo salvas!");
        }
    };

    const handleSaveField = async () => {
        if (fieldConfig && fieldConfig.id) {
            await db.fieldServiceConfig.put(fieldConfig);
            alert("Configurações de Campo salvas!");
        }
    };

    const handleExport = async () => {
        const group = await db.groupConfig.toArray();
        const field = await db.fieldServiceConfig.toArray();
        const cleaning = await db.cleaningAssignments.toArray();
        const service = await db.fieldServiceAssignments.toArray();

        const backup = { group, field, cleaning, service, version: 1, date: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("Restaurar um backup apagará os dados atuais. Continuar?")) return;

        const text = await file.text();
        try {
            const data = JSON.parse(text);
            await db.transaction('rw', db.groupConfig, db.fieldServiceConfig, db.cleaningAssignments, db.fieldServiceAssignments, async () => {
                await db.groupConfig.clear();
                await db.fieldServiceConfig.clear();
                await db.cleaningAssignments.clear();
                await db.fieldServiceAssignments.clear();

                if (data.group) await db.groupConfig.bulkAdd(data.group);
                if (data.field) await db.fieldServiceConfig.bulkAdd(data.field);
                if (data.cleaning) await db.cleaningAssignments.bulkAdd(data.cleaning);
                if (data.service) await db.fieldServiceAssignments.bulkAdd(data.service);
            });
            alert("Dados restaurados com sucesso!");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Erro ao importar backup. Verifique se o arquivo JSON é válido.");
        }
    };

    const handleReset = async () => {
        if (confirm("ATENÇÃO: Isso apagará TODOS os dados do aplicativo permanentemente. Tem certeza?") &&
            confirm("Última chance: Isso não tem volta.")) {
            await db.delete();
            alert("Dados apagados. O app será recarregado.");
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 pb-4">
            <h1 className="text-2xl font-bold">Configurações</h1>

            {/* Admin Toggle */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Modo Administrador</CardTitle>
                    {isAdmin ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-red-500" />}
                </CardHeader>
                <CardContent>
                    {isAdmin ? (
                        <div className="flex justify-between items-center">
                            <span className="text-green-600 font-medium">Ativo (Edição permitida)</span>
                            <Button variant="outline" onClick={logout}>Sair</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="flex gap-2">
                            <Input
                                type="password"
                                placeholder="PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="max-w-[100px]"
                            />
                            <Button type="submit">Entrar</Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            {/* Group Config (Only Admin) */}
            {isAdmin && groupConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Grupo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Nome do Grupo</Label>
                            <Input
                                value={groupConfig.name}
                                onChange={(e) => setGroupConfig({ ...groupConfig, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Semestre/Ano</Label>
                            <Input
                                value={groupConfig.semesterYear}
                                onChange={(e) => setGroupConfig({ ...groupConfig, semesterYear: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Superintendente</Label>
                            <Input
                                value={groupConfig.superintendent}
                                onChange={(e) => setGroupConfig({ ...groupConfig, superintendent: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Ajudante</Label>
                            <Input
                                value={groupConfig.assistant}
                                onChange={(e) => setGroupConfig({ ...groupConfig, assistant: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleSaveGroup} className="w-full">
                            <Save className="w-4 h-4 mr-2" /> Salvar Grupo
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Field Config (Only Admin) */}
            {isAdmin && fieldConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração Campo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Local de Saída</Label>
                            <Input
                                value={fieldConfig.location}
                                onChange={(e) => setFieldConfig({ ...fieldConfig, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Horário Consideração</Label>
                            <Input
                                value={fieldConfig.meetingTime}
                                onChange={(e) => setFieldConfig({ ...fieldConfig, meetingTime: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleSaveField} className="w-full">
                            <Save className="w-4 h-4 mr-2" /> Salvar Campo
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Admin Generator Tool */}
            {isAdmin && (
                <div className="mb-4">
                    <AdminGenerator />
                </div>
            )}

            {/* Backup Area */}
            <Card>
                <CardHeader>
                    <CardTitle>Backup e Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" onClick={handleExport} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Fazer Backup (JSON)
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <Button variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            Restaurar Backup
                        </Button>
                    </div>

                    {isAdmin && (
                        <div className="pt-4 border-t">
                            <Button variant="destructive" onClick={handleReset} className="w-full">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Resetar Tudo (Cuidado)
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-center text-xs text-gray-400">
                Versão 1.0.0
            </div>
        </div>
    );
}
