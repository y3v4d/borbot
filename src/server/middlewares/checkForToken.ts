import { NextFunction, Request, Response } from "express";
import Code from "../../shared/code";

export default async function CheckForToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Authentication required." });
        return;
    }

    next();
}