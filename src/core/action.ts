import Bot from "./bot";

export default interface Action {
    timeout: number;

    startOnInit: boolean;
    repeat: boolean;
    
    run: (client: Bot) => Promise<void>;
}