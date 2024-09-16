import express from 'express';
import log from "../../log"
import { apis } from './api';

const app = express();

apis.forEach(api => {

    switch (api.method) {
        case "GET":
            app.get(`/api/v1${api.path}`, api.handler)
            break;
        case "POST":
            app.post(`/api/v1${api.path}`, api.handler)
            break;
    }
})

export const start = () => {
    log.info("Starting IMAP API Server at port 3000");
    app.listen(3000);
}