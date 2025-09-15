import { getSalaConfig } from "./salas/salas.ts";
import { Contexto } from "./contexto.ts";
import { salaRepository } from "../repositories/salaRepository.ts";
import { entidadeRepository } from "../repositories/entidadeRepository.ts";

/**
 * Como só tem 1 rota, é necessário obter a situação atual do usuário parar aplicar o comando
 * Ou seja, todo comando que o usuário faz vai passar por aqui.
 */
export const onLinha = async (texto: string, usuario: {id: string}): Promise<string> => {
    // 1. Obter a situação atual do usuário e do jogo:
    // - Obter usuário: Em qual sala está? Pode realizar ações? Que itens possui?
    // - Obter sala: Qual a situação da sala nesse momento? Quais itens estão no chão? Quais entidades estão presentes?
    // - Obter entidades: Qual a situação delas?
    // - Obter itens: Qual a situação deles?
    const result = await salaRepository.dadosIniciaisJogador(usuario.id);
    const ctx: Contexto = new Contexto({
        jogador: result.entidade,
        sala: result.sala,
        global: result.global,
        itensNoChao: result.itensNoChao
    });
    const salaAntes = ctx.jogador.salaId;
    
    // 2. Processar o comando, aplicando as regras do jogo, e atualizando a situação do usuário e do jogo no banco de dados.
    // - Verificar se o comando é válido no contexto atual
    // - Atualizar a situação do usuário e do jogo no banco de dados
    // - Gerar a resposta do jogo ao comando, Mensagens de erro ou sucesso, se aplicável
    const comando = texto.trim().toUpperCase();

    // A FAZER: processar isso melhor kk
    if(!comando || comando === "OLHAR") {
        // Apenas olhar ao redor
        await ctx.descreverSala();
    } else if(comando == "PEGAR") {
        let objetos = await ctx.getItensNoChao();
        if(objetos.length == 0) {
            ctx.escrevaln("Não tem nenhum objeto para pegar");
        } else {
            await ctx.moverItem(objetos[0], { entidadeId: ctx.jogador.id });
        }
    } else if(comando == "LARGAR") {
        let objetos = await ctx.getMochila();
        if(objetos.length == 0) {
            ctx.escrevaln("Não tem nenhum objeto para largar");
        } else {
            await ctx.moverItem(objetos[0], { salaId: ctx.jogador.salaId });
        }
    } else {
        const salaConfig = getSalaConfig(ctx.jogador.salaId);
        const conexao = comando in salaConfig.conexoes && salaConfig.conexoes[comando];
        if(!conexao) {
            ctx.escrevaln("Você não pode ir por aí.");
        } else {
            const novaSalaId = await conexao(ctx);
            if(novaSalaId) {
                await ctx.moverParaSala(novaSalaId);
            }
        }
    }

    // 3. Se o jogador mudou de sala, descrever a nova sala
    if(ctx.jogador.salaId !== salaAntes) {
        ctx.escrevaln();
        await ctx.descreverSala();
    }

    // 4. Atualizar o banco de dados com a nova situação do usuário e do jogo
    await ctx.salvar();

    // 5. Retornar a resposta do jogo ao comando
    return ctx.obterTexto();
};