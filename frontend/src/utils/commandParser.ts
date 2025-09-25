import { distance, distance as levenshteinDistance } from 'fastest-levenshtein';
import anyAscii from 'any-ascii';
import { Acao, acoesConfig, DIRECOES, type AcaoValue } from './comandoConfig';
import type { RespostaEntidades, RespostaItens, RespostaSituacao } from './fetchApi';

// --- Interfaces para Estruturar os Dados do Jogo ---
export class ParserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParserError";
    }
}

interface GameContext<T> {
    alvos: Record<string, { sinonimos: string[], ref: T }>;
}

function normalize(text: string): string {
    return anyAscii(text.replaceAll(/[\r\n\t]/g," ")).toUpperCase().trim();
}

export class CommandParser<T> {
    public rawCommand: string;
    private lastArgsi: number;
    private argsi: number;
    private args: string[];
    private context: GameContext<T>;

    static buildContext({jogador, sala}: RespostaSituacao) {
        const alvos: Record<string, { sinonimos: string[], ref: RespostaItens | RespostaEntidades }> = {};
        
        for(let item of jogador.itens || []) {
            alvos[item.id] = { sinonimos: item.nome.split(" "), ref: item };
        }
        for(let item of sala.itens || []) {
            alvos[item.id] = { sinonimos: item.nome.split(" "), ref: item };
        }
        for(let ent of sala.entidades || []) {
            alvos[ent.id] = { sinonimos: ent.nome ? ent.nome.split(" ") : ent.tipo.split(" "), ref: ent };
            if(ent.username) {
                alvos[ent.id].sinonimos.push(ent.username);
            }
            
            for(let item of ent.itens || []) {
                alvos[item.id] = { sinonimos: item.nome.split(" "), ref: item };
            }
        }

        return alvos;
    }

    constructor(command: string, context: GameContext<T>) {
        this.rawCommand = command;
        this.context = context;
        this.args = [];
        this.argsi = 0;
        this.lastArgsi = 0;

        for(const key of Object.keys(this.context.alvos)) {
            this.context.alvos[key].sinonimos = this.context.alvos[key].sinonimos.map(s => normalize(s));
        }
        this.args = this.rawCommand.split(/\s+/).map(p => normalize(p)).filter(p => {
            return p.length > 0
        });
        this.argsi = 0;
    }

    private findBestMatch(term: string, candidates: Record<string, { sinonimos: string[] }>, threshold = 2) {
        const keys = Object.keys(candidates);
        const matches: { match: string; confidence: number }[]  = [];

        if (keys.length === 0) return matches;

        if(!term) {
            return keys.map(k => ({ match: k, confidence: 0 }));
        }

        for (const key of keys) {
            let match: string | null = null;
            let minDistance = Infinity;

            const { sinonimos } = candidates[key];
            for(const sinonimo of sinonimos) {
                const distance = levenshteinDistance(term, sinonimo);

                if (distance < minDistance) {
                    minDistance = distance;
                    match = key;
                }
            }

            threshold = Math.min(threshold, Math.floor(term.length / 2));
            if (match && minDistance <= threshold) {
                const confidence = term.length > 0 ? 1 - (minDistance / term.length) : 0;
                matches.push({ match, confidence: confidence });
            }
        }

        matches.sort((a, b) => b.confidence - a.confidence);

        return matches;
    }

    private proximaPalavra() {
        return this.argsi < this.args.length ? this.args[this.argsi++] : null;
    }

    private extrairComando(palavra?: string | null | undefined) {
        if(!palavra) {
            return [{ match: null, confidence: 0 }];
        }
        return this.findBestMatch(palavra, acoesConfig);
    }

    private proximoArgumento() {
        this.lastArgsi = this.argsi;
        let palavra: string | null;
        do {
            palavra = this.proximaPalavra();
            if(!palavra) {
                break;
            }
            
            const { match, confidence } = this.findBestMatch(palavra, {
                [Acao.Artigos]: acoesConfig[Acao.Artigos],
                [Acao.Preposicoes]: acoesConfig[Acao.Preposicoes],
                [Acao.Contracoes]: acoesConfig[Acao.Contracoes],
            }, 0).at(0) || { match: null, confidence: 0 };
            
            if(!match) {
                return { confidence: 0, texto: palavra};
            }

            const ehConector = match === Acao.Artigos || match === Acao.Preposicoes || match === Acao.Contracoes;
            if(!ehConector) {
                return { confidence: confidence, texto: palavra };    
            }
        } while (palavra !== null);

        return { confidence: 0, texto: null };
    }

    private proximoComando() {
        this.lastArgsi = this.argsi;
        let palavra: string | null;
        do {
            palavra = this.proximaPalavra();
            const { match, confidence } = this.extrairComando(palavra).at(0) || { match: null };
            
            if(!match) {
                return { acao: null, confidence: 0, texto: palavra};
            }

            const ehConector = match === Acao.Artigos || match === Acao.Preposicoes || match === Acao.Contracoes;
            if(!ehConector) {
                return { acao: match as AcaoValue, confidence: confidence, texto: palavra };    
            }
        } while (palavra !== null);

        return { acao: null, confidence: 0, texto: null };
    }

    private proximoAlvo(esperarQuantidade: boolean, obrigatorioAchar: boolean) {
        let quantidade: number | undefined = undefined;
        let oq = this.proximoArgumento();

        // Pegar 3 pedras
        if(oq.texto && esperarQuantidade && oq.texto.match(/^\d+$/)) {
            quantidade = parseInt(oq.texto);
            if(quantidade <= 0) {
                throw new ParserError(`A quantidade deve ser maior que zero.`);
            }

            oq = this.proximoArgumento();
        }

        // Se não informar o alvo, pode ser qualquer coisa
        if(!oq.texto) {
            return {alvo: this.findBestMatch("", this.context.alvos), oq, quantidade};
        }

        // Encontrar o alvo
        const alvo = this.findBestMatch(oq.texto, this.context.alvos);
        if(alvo.length === 0) {
            // Se o alvo for obrigatório, erro, senão é porque não se referiu a nada específico
            this.argsi = this.lastArgsi;
            if(!obrigatorioAchar) {
                return {alvo: [], oq, quantidade};
            } //else {
                // Comando que precisa de alvo, mas não tem, pode ser qualquer um
                //return {alvo: this.findBestMatch("", this.context.alvos), oq, quantidade};
            //}
            throw new ParserError(`Não há nenhum '${oq.texto}' aqui`);
        }

        // Ignorar outras palavras que fazem parte do mesmo objeto/entidade. ex: pegar livro de pedra
        // A FAZER: usar isso para melhorar a desambiguação
        /*if(alvo.length === 1) while(true) {
            const prox = this.proximoArgumento();
            if(!prox.texto) break;

            // Deve ignorar apenas se der EXATAMENTE 1 match, melhor resolver depois na desambiguação
            const proxAlvo = this.findBestMatch(prox.texto, this.context.alvos);
            if(proxAlvo.length === 1 && proxAlvo[0].match === alvo[0].match) {
                continue;
            }
            this.argsi = this.lastArgsi;
            break;
        }*/

        return {alvo, oq, quantidade};
    }
    
    public parse() {
        let cmd = this.proximoComando();
        if(cmd.acao === Acao.Ir) {
            cmd = this.proximoComando();
            if(!cmd.acao || !DIRECOES.includes(cmd.acao)) {
                throw new ParserError("Comando 'ir' deve ser seguido por uma direção válida.");
            }
        }

        if(!cmd.acao) {
            if(!cmd.acao && !cmd.texto) return { acao: null, quantidade: undefined, alvoA: [], alvoB: [], resto: this.args.slice(this.argsi).join(" ") };

            const sorteio = Math.floor(Math.random() * 5);
            if(sorteio === 0) throw new ParserError("Comando desconhecido. Precisa de ajuda? escreva 'ajuda'.");
            if(sorteio === 1) throw new ParserError("sflhs fsfh sd fjsdhfsdjfsdfsd sdfsdf - Foi isso que entendi");
            if(sorteio === 2) throw new ParserError("Me desculpe?");
            if(sorteio === 3) throw new ParserError("Tem certeza que não precisa de ajuda?");
            throw new ParserError("... ?");
        }

        let acao = cmd.acao as AcaoValue;
        let quantidade: number | undefined = undefined;

        if(acoesConfig[acao].maxArgs === 0) {
            return { acao, quantidade, alvoA: [], alvoB: [], resto: this.args.slice(this.argsi).join(" ") };
        }
        
        const { alvo: alvoA, oq, quantidade: _quantidade } = this.proximoAlvo(acoesConfig[acao].quantidade === true, acoesConfig[acao].args >= 1);
        quantidade = _quantidade;
        
        if(acao === Acao.Usar) {
            // usar <obj2> para? <cmd> <obj1>
            // usar papel para escrever
            // usar saco para colocar lanche
            
            const usarAcao = this.proximoComando();
            if(!usarAcao.acao) {
                throw new ParserError(`Você quer usar ${oq.texto} para fazer o quê?`);
            }

            acao = usarAcao.acao as AcaoValue; 
        }

        let comoq = this.proximoArgumento();
        if(comoq.texto) {
            // Muda o comando pois refere-se a algo
            if(acao === Acao.Largar) {
                acao = Acao.Colocar;
                this.argsi = this.lastArgsi;
            } else if(acao === Acao.Mover || acao === Acao.Tocar) {
                acao = Acao.Virar;
                this.argsi = this.lastArgsi;
            } else if(acao === Acao.Abrir) {
                acao = Acao.Destrancar;
                this.argsi = this.lastArgsi;
            } else if(acao === Acao.Fechar) {
                acao = Acao.Trancar;
                this.argsi = this.lastArgsi;
            }

            // Colocar no chão vira largar
            else if(acao === Acao.Colocar && this.extrairComando(comoq.texto).at(0)?.match === Acao.Chao) {
                acao = Acao.Largar;
            }

            // Colocar na mochila vira pegar
            else if(acao === Acao.Colocar && this.extrairComando(comoq.texto).at(0)?.match === Acao.Mochila) {
                acao = Acao.Pegar;
            } else {
                this.argsi = this.lastArgsi;
            }
        }

        if(acoesConfig[acao].maxArgs === 1) {
            return { acao, quantidade, alvoA: alvoA, alvoB: [], resto: this.args.slice(this.argsi).join(" ") };
        }

        const { alvo: alvoB, oq: oq2, quantidade: _quantidade2 } = this.proximoAlvo(acoesConfig[acao].quantidade === true, acoesConfig[acao].args >= 2);
        quantidade = quantidade !== undefined ? quantidade : _quantidade2;

        return { acao, quantidade, alvoA: alvoA, alvoB: alvoB, resto: this.args.slice(this.argsi).join(" ") };
    }
}
