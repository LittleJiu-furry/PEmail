import express from 'express';
import log from "../../log"
import { apis } from './api';

const app = express();
export const start = () => {
    log.info("Starting IMAP API Server at port 3000");
    app.listen(3000);
}

apis.forEach(api => {
    const fn = (app as any)[api.method.toLowerCase()] as unknown as typeof app.get;
    fn && fn(`/api/v1${api.path}`, api.handler);
})
