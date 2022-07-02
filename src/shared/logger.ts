import { closeSync, openSync, writeFileSync } from "fs";

let firstWrite = true;

const PATH = "./logs/";
let filename = PATH;

export enum LoggerType {
    NORMAL = "NORMAL",
    WARN = "WARN",
    ERROR = "ERROR"
}

export default function logger(msg: string, type = LoggerType.NORMAL) {
    const date = new Date(Date.now());

    let dateMsg = `${date.getFullYear().toString()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate().toString().padStart(2, '0'))}`;
    dateMsg += ` ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

    const finalMsg = `[${dateMsg}${(type != LoggerType.NORMAL ? ` ${type}` : "")}] ${msg}`;

    switch(type) {
        case LoggerType.NORMAL:
            console.log(finalMsg);
            break;
        case LoggerType.WARN:
            console.warn(finalMsg);
            break;
        case LoggerType.ERROR:
            console.error(finalMsg);
            break;
        default:
            break;
    }

    if(firstWrite) {
        filename += `log_${dateMsg}.txt`.replaceAll(' ', '_').replaceAll('-', '_').replaceAll(':', '_');
        firstWrite = false;
    }

    const file = openSync(filename, 'a+', 0o666);
    writeFileSync(file, `${finalMsg}\n`, 'utf-8');
    closeSync(file);
}