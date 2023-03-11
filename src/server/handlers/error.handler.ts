import { NextFunction, Request, Response } from "express";
import Code, { CodeMessage } from "../../shared/code";
import logger, { LoggerType } from "../../shared/logger";

function ErrorHandler (err: any, req: Request, res: Response, next: NextFunction) {
    if(err.code === undefined) {
        logger(`Unknown error: ${err.message}`, LoggerType.ERROR);

        res.status(500).send({ code: -1, message: 'Unknown error' });
        return;
    } else if(err.code === Code.DISCORD_API_ERROR) {
        logger(`Discord call failed with status ${err.status}, path: ${err.path}, message: ${err.data.message}`, LoggerType.ERROR);
        
        if(err.status === 401) {
            res.status(401).send({ code: Code.DISCORD_INVALID_TOKEN, message: "Invalid token" });

            return;
        } else if(err.status == 429) {
            res.status(429).send({ code: Code.DISCORD_RATE_LIMIT, message: "You reached discord rate limit for this call" });
        }
    } else if(err.code === Code.NO_RESPONSE) {
        logger(`No reponse from discord servers`, LoggerType.ERROR);

        res.status(504).send({ code: Code.NO_RESPONSE, message: "Didn't receive any reponse from the server" });
    } else if(err.code === Code.INTERNAL_SERVER_ERROR) {
        logger(`Internal error: ${err.message}`, LoggerType.ERROR);

        res.status(500).send({ code: Code.INTERNAL_SERVER_ERROR, message: "Internal server error" });
    } else {
        res.status(404).send({ code: err.code, message: CodeMessage[err.code] || '' });
    }
};

export default ErrorHandler;