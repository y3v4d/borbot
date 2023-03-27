import { closeSync, openSync, writeFileSync } from "fs";
import { dateToString } from "./utils";

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

    let dateMsg = `${dateToString(date, 'Y-M-D h:m:s')}`;

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
        filename += `log_${dateToString(date)}.txt`.replaceAll(' ', '_').replaceAll('-', '_').replaceAll(':', '_');
        firstWrite = false;
    }

    const file = openSync(filename, 'a+', 0o666);
    writeFileSync(file, `${finalMsg}\n`, 'utf-8');
    closeSync(file);
}