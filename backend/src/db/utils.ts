import { getTableColumns } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core"

export const UUID_ZERO = '00000000-0000-0000-0000-000000000000';

export const mapArrayWithTable = <T extends PgTableWithColumns<any>>(table: T) => {
    const tableColumns = getTableColumns(table);
    return {
        mapFromDriverValue: (value: unknown) => {
            if (typeof value !== "object" || value === null) {
                throw new Error("Invalid value");
            }
            if(!Array.isArray(value)) {
                throw new Error("Expected an array");
            }

            return value.map(v => {
                if (typeof v !== "object" || v === null) {
                    //throw new Error("Invalid item in array");
                    console.warn("Invalid item in array:", v); 
                    return v;
                }
                
                const result: Record<string, unknown> = {};
                for(const columnAlias in tableColumns) {
                    const pgColumn = tableColumns[columnAlias];
                    result[columnAlias] = pgColumn.mapFromDriverValue(v[pgColumn.name]);
                }
                return result;
            }) as (T["$inferSelect"])[];
        }
    }
}

// https://stackoverflow.com/questions/53503813/get-dictionary-object-keys-as-tuple-in-typescript
export type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never;

export type UnionToTuple<T> = UnionToIntersection<
  T extends never ? never : (t: T) => T
> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

export const getTupleFromKeys = <T extends string>(obj: Record<T, unknown>): UnionToTuple<T> => {
    const keys = Object.keys(obj) as T[];
    return keys as UnionToTuple<T>;
}