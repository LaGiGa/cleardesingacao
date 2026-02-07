import Dexie, { type EntityTable } from 'dexie';

export interface GroupConfig {
    id: number;
    name: string;
    semesterYear: string;
    superintendent: string;
    assistant: string;
}

export interface FieldServiceConfig {
    id: number;
    location: string;
    meetingTime: string;
}

export interface CleaningAssignment {
    id: number;
    date: string; // ISO YYYY-MM-DD
    monthLabel: string;
    dayText: string;
    designatedBrothers: string[];
    observation?: string;
}

export interface FieldServiceAssignment {
    id: number;
    date: string; // ISO YYYY-MM-DD
    dayText: string;
    leader: string;
    specialMarker?: string;
}

const db = new Dexie('AppDatabase') as Dexie & {
    groupConfig: EntityTable<GroupConfig, 'id'>,
    fieldServiceConfig: EntityTable<FieldServiceConfig, 'id'>,
    cleaningAssignments: EntityTable<CleaningAssignment, 'id'>,
    fieldServiceAssignments: EntityTable<FieldServiceAssignment, 'id'>
};

// Define schema
db.version(1).stores({
    groupConfig: '++id',
    fieldServiceConfig: '++id',
    cleaningAssignments: '++id, date, monthLabel',
    fieldServiceAssignments: '++id, date'
});

// Seed data
db.on('populate', () => {
    db.groupConfig.add({
        name: "Grupo Arno 73",
        semesterYear: "Semestre/2025",
        superintendent: "Alonso Gomes",
        assistant: "Clécio Morais"
    });

    db.fieldServiceConfig.add({
        location: "Casa da irmã Osana",
        meetingTime: "8h30"
    });

    const cleaningData = [
        { date: "2025-09-03", monthLabel: "Setembro", dayText: "quarta-feira, 3 de setembro de 2025", designatedBrothers: ["Josivan", "Edileuza", "Laércio"] },
        { date: "2025-09-07", monthLabel: "Setembro", dayText: "domingo, 7 de setembro de 2025", designatedBrothers: ["Cícero", "Márcia", "Graça"] },
        { date: "2025-10-01", monthLabel: "Outubro", dayText: "quarta-feira, 1 de outubro de 2025", designatedBrothers: ["Alonso", "Luciana", "Laura"] },
        { date: "2025-10-05", monthLabel: "Outubro", dayText: "domingo, 5 de outubro de 2025", designatedBrothers: ["Wideglan", "Idailde", "Graziela"] },
        { date: "2025-11-05", monthLabel: "Novembro", dayText: "quarta-feira, 5 de novembro de 2025", designatedBrothers: ["Junior Fernandes", "Jamila", "Osana"] },
        { date: "2025-11-09", monthLabel: "Novembro", dayText: "domingo, 9 de novembro de 2025", designatedBrothers: ["Cléssio", "Regeane", "Maria de Fátima"] },
        { date: "2025-12-03", monthLabel: "Dezembro", dayText: "quarta-feira, 3 de dezembro de 2025", designatedBrothers: ["Josivan", "Edileuza", "Laércio"] },
        { date: "2025-12-07", monthLabel: "Dezembro", dayText: "domingo, 7 de dezembro de 2025", designatedBrothers: ["Cícero", "Márcia", "Graça"] },
        { date: "2025-12-31", monthLabel: "Dezembro", dayText: "quarta-feira, 31 de dezembro de 2025", designatedBrothers: ["Alonso", "Luciana", "Laura"] },
        { date: "2026-01-04", monthLabel: "jan/26", dayText: "domingo, 4 de janeiro de 2026", designatedBrothers: ["Wideglan", "Idailde", "Graziela"] },
        { date: "2026-01-28", monthLabel: "jan/26", dayText: "quarta-feira, 28 de janeiro de 2026", designatedBrothers: ["Junior Fernandes", "Jamila", "Osana"] },
        { date: "2026-02-01", monthLabel: "fev/26", dayText: "domingo, 1 de fevereiro de 2026", designatedBrothers: ["Cléssio", "Regeane", "Maria de Fátima"] }
    ];
    // Using as any to bypass TS checks during seed for brevity, though type matching is safer
    db.cleaningAssignments.bulkAdd(cleaningData as any);

    const fieldData = [
        { date: "2025-11-02", dayText: "domingo, 2 de novembro de 2025", leader: "Clécio Moraes" },
        { date: "2025-11-09", dayText: "domingo, 9 de novembro de 2025", leader: "Wideglan Pereira" },
        { date: "2025-11-16", dayText: "domingo, 16 de novembro de 2025", leader: "Alonso Gomes" },
        { date: "2025-11-23", dayText: "domingo, 23 de novembro de 2025", leader: "Cícero Castro" },
        { date: "2025-11-30", dayText: "domingo, 30 de novembro de 2025", leader: "Rafael Leão" },
        { date: "2025-12-07", dayText: "domingo, 7 de dezembro de 2025", leader: "Pedro Avelino" },
        { date: "2025-12-14", dayText: "domingo, 14 de dezembro de 2025", leader: "Assembleia de Circuito", specialMarker: "Assembleia de Circuito" },
        { date: "2025-12-21", dayText: "domingo, 21 de dezembro de 2025", leader: "Clécio Moraes" },
        { date: "2025-12-28", dayText: "domingo, 28 de dezembro de 2025", leader: "Wideglan Pereira" },
        { date: "2026-01-04", dayText: "domingo, 4 de janeiro de 2026", leader: "Cícero Castro" },
        { date: "2026-01-11", dayText: "domingo, 11 de janeiro de 2026", leader: "Rafael Leão" },
        { date: "2026-01-18", dayText: "domingo, 18 de janeiro de 2026", leader: "Alonso Gomes" },
        { date: "2026-01-25", dayText: "domingo, 25 de janeiro de 2026", leader: "Pedro Avelino" },
        { date: "2026-02-01", dayText: "domingo, 1 de fevereiro de 2026", leader: "Clécio Moraes" },
        { date: "2026-02-08", dayText: "domingo, 8 de fevereiro de 2026", leader: "Wideglan Pereira" },
        { date: "2026-02-15", dayText: "domingo, 15 de fevereiro de 2026", leader: "Alonso Gomes" },
        { date: "2026-02-22", dayText: "domingo, 22 de fevereiro de 2026", leader: "Cícero Castro" }
    ];
    db.fieldServiceAssignments.bulkAdd(fieldData as any);
});

export { db };
