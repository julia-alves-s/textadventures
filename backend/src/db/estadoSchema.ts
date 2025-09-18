export interface EstadoItem {
    [key: string]: EstadoItem | EstadoItem[] | string | number | boolean | null;
}

export type Estado = Record<string, EstadoItem | EstadoItem[] | string | number | boolean | null>;