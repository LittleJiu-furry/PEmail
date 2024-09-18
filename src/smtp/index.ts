import { SMTPServer } from "smtp-server";
import log from "./../log"
import fs from "fs";
import path from "path";
import opts from "./opts";
import { Console } from "winston/lib/winston/transports";

export const start = ({
    serverName = "",
    key_path = "",
    cert_path = "",
} = {}) => {
    log.info("SMTP server started at ports 465 (SSL) and 587")

    const SSL = new SMTPServer({
        name: serverName,
        authOptional: true,
        secure: true,
        hideSTARTTLS: true,
        key: fs.readFileSync(path.join(__dirname , key_path)), // 证书路径
        cert: fs.readFileSync(path.join(__dirname , cert_path)), // 私钥路径
        onAuth: opts.onAuth,
        onData: opts.onData,
        onMailFrom: opts.onMailFrom,
        onRcptTo: opts.onRcptTo,
        onClose: opts.onClose,
        onConnect: opts.onConnect,
        
        
    })
    
    const NOSSL = new SMTPServer({
        name: serverName,
        authOptional: true,
        secure: false,
        allowInsecureAuth: true,
        onAuth: opts.onAuth,
        onData: opts.onData,
        onMailFrom: opts.onMailFrom,
        onRcptTo: opts.onRcptTo,
        onClose: opts.onClose,
        onConnect: opts.onConnect,
    })

    SSL.listen(465)
    NOSSL.listen(587)
}