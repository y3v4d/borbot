import express from "express";

const TestRouter = express.Router();

TestRouter.get('/', (req, res) => {
    res.send("Hello from the test!");
});

export default TestRouter;