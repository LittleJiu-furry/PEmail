import { IMAPServer } from "./imap-server/imap-server";
import log from "../log";
import fs from "fs";
import path from "path";

export const start = ({
    serverName = "",
    key_path = "",
    cert_path = "",
} = {
}) => {
    log.info("Starting IMAP server at port 143")
    const server = new IMAPServer({
        servername: serverName,
        tlsOptions: {
            key: fs.readFileSync(path.join(__dirname , key_path)),
            cert: fs.readFileSync(path.join(__dirname , cert_path)),
        }
    })
    server.listen(143)
}



