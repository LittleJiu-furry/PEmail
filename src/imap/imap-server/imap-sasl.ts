import type { IMAPConnection } from "./imap-connection";
import type { Socket } from "./types";
export class IMAP_SASL {
    static createPlainAuth(args:any[], callback:() => void) {
        const [tag, cmd, mechanism] = args;
        const connection = this as unknown as IMAPConnection;
        connection._socket.write("+ \r\n");
        connection._nextHandler = IMAP_SASL.SASL_PLAIN_AUTH.bind(connection, true, tag);
    }

    static SASL_PLAIN_AUTH(canAbort: boolean , tag:string, command: string, cb: () => void, connection: IMAPConnection) {
        if(canAbort && command === "*") {
            connection.send("BAD AUTHENTICATE abort", tag);
            return cb();
        }

        const [authid, username, passwd] = Buffer.from(command, "base64").toString().split("\0");
        if(!username || !passwd) {
            connection.send("NO AUTHENTICATE failed", tag);
            return cb();
        }
        
        connection._server.onAuth(
            {
                method: "AUTHENTICATE PLAIN",
                username,
                password: passwd,
            },
            connection.session,
            (err, user) => {
                if(err) {
                    connection.send("NO AUTHENTICATE failed, " + err.message, tag);
                    return cb();
                }
                connection.session.user = user;
                connection.send("OK AUTHENTICATE completed", tag);
                return cb();
            }
        )
    }

    static createLoginAuth(args:any[], callback:() => void) {
        const [tag, cmd, mechanism] = args;
        const connection = this as unknown as IMAPConnection;
        connection._socket.write("+ \r\n");
        connection._nextHandler = IMAP_SASL.SASL_LOGIN_USER.bind(connection, tag);
    }

    static SASL_LOGIN_USER(tag:string, command: string, cb: () => void, connection: IMAPConnection) {
        if(command === "*") {
            connection.send("BAD AUTHENTICATE abort", tag);
            return cb();
        }

        const username = Buffer.from(command, "base64").toString();
        if(!username) {
            connection.send("NO AUTHENTICATE failed", tag);
            return cb();
        }

        connection._socket.write("+ \r\n");
        connection._nextHandler = IMAP_SASL.SASL_LOGIN_PASS.bind(connection, tag, username);
    }

    static SASL_LOGIN_PASS(tag:string, username: string, command: string, cb: () => void, connection: IMAPConnection) {
        if(command === "*") {
            connection.send("BAD AUTHENTICATE abort", tag);
            return cb();
        }

        const passwd = Buffer.from(command, "base64").toString();
        if(!passwd) {
            connection.send("NO AUTHENTICATE failed", tag);
            return cb();
        }

        connection._server.onAuth(
            {
                method: "AUTHENTICATE LOGIN",
                username,
                password: passwd,
            },
            connection.session,
            (err, user) => {
                if(err) {
                    connection.send("NO AUTHENTICATE failed, " + err.message, tag);
                    return cb();
                }
                connection.session.user = user;
                connection.send("OK AUTHENTICATE completed", tag);
                return cb();
            }
        )
    }

    
}