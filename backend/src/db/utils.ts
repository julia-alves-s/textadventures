import { getTableColumns } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core"

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
                    throw new Error("Invalid item in array");
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