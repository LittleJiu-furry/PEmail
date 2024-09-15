import { IMAPServer } from "./imap-server/imap-server";
import log from "../log";

export const start = () => {
    log.info("Starting IMAP server at port 143")
    const server = new IMAPServer()
    server.listen(143)
}



