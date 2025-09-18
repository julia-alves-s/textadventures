// Adaptado de https://github.com/xtermjs/xtermjs.org/blob/master/js/demo.js
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const term = new Terminal({
    cursorBlink: true,
    fontFamily: "monospace",
    allowProposedApi: true
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('xterm-container')!);

// Make the terminal's size and geometry fit the size of #terminal-container
fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());

export function _prompt() {
    command = '';
    term.write('\r\n> ');
}

export function termPrint(...str: unknown[]) {
    for(let s of str) {
        if(!s) continue;
        term.write((""+s).replaceAll("\n","\r\n")+" ");
    }
    term.writeln(" ");
}

export function termPrintRaw(str: unknown) {
    term.write((""+str)?.replaceAll("\n","\r\n") || "");
}

export function termClear() {
    term.clear();
}

let waitingPrompt: ((input: string | Error) => void) | null = null;
export function prompt(...str: unknown[]): Promise<string> {
    command = '';
    const last = str.pop() || "> ";
    termPrint(...str);
    
    term.write(""+last);
    return new Promise<string>((resolve, reject) => {
        waitingPrompt = (input: string | Error) => {
            waitingPrompt = null;
            if(input instanceof Error) {
                reject(input);
            } else {
                resolve(input);
            }
        };
    });
}

let passwordMode = false;
export async function passwordPrompt(...str: unknown[]) {
    passwordMode = true;
    const result = await prompt(...str);
    passwordMode = false;
    return result;
}

let command = '';
type ComandConfig = {
    f: (...args: string[]) => void | Promise<void>,
    help?: string
}
let commands: Record<string, ComandConfig> = {};

export function addCommand(cmd: string, config: ComandConfig) {
    commands[cmd] = config;
}

function onInput(term: Terminal, text: string) {
    text = text?.trim() || "";

    if(waitingPrompt) {
        term.writeln("");
        waitingPrompt(text);
        return;
    }

    const args = text?.split(' ') || [];
    const command = args?.shift() || "";
    if (command.length > 0) {
        term.writeln('');
        if (command in commands) {
            let promise = commands[command].f(...args);
            if(promise && promise.then) {
                promise.then(() => {
                    _prompt();
                });
            }
            if(promise && promise.catch) {
                promise.catch((err) => {
                    termPrint("Erro:", err?.toString());
                    _prompt();
                });
            } 
            return;
        }
        term.writeln(`${command}: é oq? digite 'ajuda' para mais informações`);
    }
    _prompt();
}

function runFakeTerminal() {
    if ((term as any)._initialized) {
        return;
    }

    (term as any)._initialized = true;

    (term as any).prompt = () => {
        term.write('\r\n$ ');
    };

    term.onData(e => {
        switch (e) {
            case '\u0003': // Ctrl+C
                term.write('^C');
                _prompt();
                if(waitingPrompt) {
                    waitingPrompt(new Error("Ctrl + C"));   
                }
                break;
            case '\r': // Enter
                onInput(term, command);
                command = '';
                break;
            case '\u007F': // Backspace (DEL)
                // Do not delete the prompt
                if ((term as any)._core.buffer.x > 2) {
                    term.write('\b \b');
                    if (command.length > 0) {
                        command = command.slice(0, command.length - 1);
                    }
                }
                break;
            default: // Print all other characters for demo
                if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                    command += e;
                    term.write(passwordMode ? "*" : e);
                }
        }
    });
}

runFakeTerminal();