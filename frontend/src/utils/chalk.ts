import { Chalk } from "chalk";

// https://github.com/xtermjs/xterm.js/issues/895
export const getChalk = (forceColor: boolean) => {
    return new Chalk({
        level: forceColor ? 2 : 0
    });
}

