"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_1 = require("../actions");
exports.default = (client) => {
    client.on('ready', async () => {
        if (!client.user || !client.application)
            return;
        actions_1.Actions.forEach(action => {
            if (action.repeat)
                setInterval(() => action.run(client), action.timeout);
            else
                setTimeout(() => action.run(client), action.timeout);
            if (action.startOnInit)
                action.run(client);
        });
    });
};
