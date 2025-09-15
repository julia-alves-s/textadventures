import { Estado } from "../../db/estadoSchema.ts";
import { Contexto, SalaType } from "../contexto.ts";
import { salasInicio } from "./inicio.ts";

export const salas: Record<string, SalaType> = {
    ...salasInicio
};

export const getSalaConfig = (salaId: string) => {
    let salaConfig = salas[salaId];
    if(!salaConfig) {
        throw new Error(`Sala com id ${salaId} não existe na configuração do jogo!`);
    }
    return salaConfig;
}