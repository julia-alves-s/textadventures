export interface EstadoItem {
    [key: string]: EstadoItem | EstadoItem[] | string | number | boolean | null;
}

export type Estado = Record<string, EstadoItem | EstadoItem[] | string | number | boolean | null>;

export type MaybePromise<T> = T | Promise<T>;

export type ArrowOrValue<T> = T | (() => MaybePromise<T>);

export const execArrowOrValue = async <T>(arrowOrValue: ArrowOrValue<T>) => {
    if(typeof arrowOrValue === "function" && !("nome" in arrowOrValue)) {
        return (await (arrowOrValue as () => MaybePromise<T>)());
    } else {
        return arrowOrValue as T;
    }
}

export class JogoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "JogoError";
    }
}