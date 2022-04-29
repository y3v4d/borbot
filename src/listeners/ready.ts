import Bot from "../core/bot";
import { Actions } from "../actions";

export default (client: Bot): void => {
    client.on('ready', async () => {
        if(!client.user || !client.application) return;
        
        Actions.forEach(action => {
            if(action.repeat) setInterval(() => action.run(client), action.timeout);
            else setTimeout(() => action.run(client), action.timeout);

            if(action.startOnInit) action.run(client);
        });
    });
}