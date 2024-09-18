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
    log.info("Starting IMAP server at port 993 (SSL) and 143")
    const SSL = new IMAPServer({
        servername: serverName,
        useSSL: true,
        tlsOptions: {
            key: fs.readFileSync(path.join(__dirname , key_path)),
            cert: fs.readFileSync(path.join(__dirname , cert_path)),
        },
        debugLogger: log,
        timeout: 30 * 60 * 1000
    })
    const NOSSL = new IMAPServer({
        servername: serverName,
        debugLogger: log,
        timeout: 30 * 60 * 1000
    })
    SSL.listen(993)
    NOSSL.listen(143)
}



