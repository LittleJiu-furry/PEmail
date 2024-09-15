import type { IMAPConnection } from "./imap-connection"
import { IMAP_SASL } from "./imap-sasl";

export const handler:{
    [key: string]: (
        command: string,
        callback: (...args: any[]) => void,
        connection: IMAPConnection
    ) => void
} = {
    APPEND: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(!connection.session.user) {
            return connection.send("BAD Authentification required", tag);
        }

        if(args.length < 2) {
            return connection.send("BAD APPEND command requires a mailbox and a message literal", tag);
        }

        const mailbox = args[0];
        // APPEND <mailbox> [<flag-list>] [<date-time>] {<message-size>}
        // 解析可选参数
        let flags: string[] = [];
        let dateTime = '';
        let size = 0;
        let i = 1;
        if(args[1].startsWith("(")) {
            flags = args[1].slice(1, -1).split(" ");
            i++;
        }
        if(args[i].startsWith('"')) {
            dateTime = args[i].slice(1, -1);
            i++;
        }
        size = parseInt(args[i]);
        if(isNaN(size)) {
            return connection.send("BAD APPEND command requires a message literal", tag);
        }
        // TODO: 
        connection._onEvent("APPEND", mailbox, flags, dateTime, size, tag);
        connection.send("OK APPEND completed", tag);

    },
    AUTHENTICATE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            return connection.send("BAD AUTHENTICATE command requires a mechanism", tag);
        }
        const mechanism = args[0];
        switch(mechanism.toUpperCase()) {
            case "PLAIN":
                return IMAP_SASL.createPlainAuth.bind(connection)([tag, cmd, mechanism], cb);
            case "LOGIN":
                return IMAP_SASL.createLoginAuth.bind(connection)([tag, cmd, mechanism], cb);


        }
        
    },
    CAPABILITY: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection.send("IMAP IMAP4rev1 AUTH=PLAIN AUTH=LOGIN");
        if(connection._isSuport("IDLE")) {
            connection.send("IDLE");
        }
        connection.send("OK CAPABILITY completed", tag);
        
    },
    LOGIN: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            return connection.send("BAD LOGIN command requires a username and a password", tag);
        }
        const username = args[0];
        const password = args[1];
        connection._server.onAuth(
            {
                method: "LOGIN",
                username,
                password,
            },
            connection.session,
            (err, user) => {
                if(err) {
                    connection.send("NO LOGIN failed, " + err.message, tag);
                    return cb();
                }
                connection.session.user = user;
                connection.send("OK LOGIN completed", tag);
                return cb();
            }
        )
    }


}