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
            connection.send("BAD Authentification required", tag);
            return cb();
        }

        if(args.length < 2) {
            connection.send("BAD APPEND command requires a mailbox and a message literal", tag);
            return cb();
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
            connection.send("BAD APPEND command requires a message literal", tag);
            return cb();
        }

        connection._socket.write("+ Ready for literal data\r\n");
        const getMessage = (command: string, cb: (...args:any[]) => void, connection: IMAPConnection) => {
            connection._socket.on("readable", () => {
                const chunk = connection._socket.read(size);
                if(chunk) {
                    connection._server.onAppend(
                        connection.session,
                        mailbox,
                        flags,
                        dateTime,
                        size,
                        chunk.toString(),
                        (err?: Error | null) => {
                            if(err) {
                                connection.send("NO APPEND failed, " + err.message, tag);
                                return cb();
                            }
                            connection.send("OK APPEND completed", tag);
                            return cb();
                        }
                    )
                }
            })
        }

        connection._nextHandler = getMessage.bind(connection);
        return cb();

    },
    AUTHENTICATE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD AUTHENTICATE command requires a mechanism", tag);
            return cb();
        }
        const mechanism = args[0];
        switch(mechanism.toUpperCase()) {
            case "PLAIN":
                IMAP_SASL.createPlainAuth.bind(connection)([tag, cmd, mechanism]);
                return cb();
                case "LOGIN":
                IMAP_SASL.createLoginAuth.bind(connection)([tag, cmd, mechanism]);
                return cb();

        }
        
    },
    CAPABILITY: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        if(connection._authed) {
            connection.send("CAPABILITY IMAP4rev1")
            if(connection._isSuport("IDLE")) {
                connection.send("IDLE");
            }
            connection.send("OK CAPABILITY completed", tag);
            return cb();
        } else {
            connection.send("CAPABILITY IMAP IMAP4rev1 AUTH=PLAIN AUTH=LOGIN");
            connection.send("OK CAPABILITY completed", tag);
            return cb();
        }
        
    },
    CHECK: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection._server.onCheck(
            connection.session,
            (err?: Error | null) => {
                if(err) {
                    // should not happen, ignore it
                }
                connection.send("OK CHECK completed", tag);
                return cb();
            }
        )
    },
    CLOSE: (command, cb, connection) => {
        // 用于关闭当前邮箱，并删除所有标记为Deleted的邮件
        const [tag, cmd]= command.split(" ");
        connection._server.onBoxClose(
            connection.session,
            (err?: Error | null) => {
                if(err) {
                    // should not happen, ignore it
                }
                connection.session.currentBox = '';
                connection.send("OK CLOSE completed", tag);
                return cb();
            }
        )
    },
    COPY: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD COPY command requires a source mailbox and a destination mailbox", tag);
            return cb();
        }
        const sourceMailbox = args[0];
        const destinationMailbox = args[1];
        connection._server.onCopy(
            connection.session,
            sourceMailbox,
            destinationMailbox,
            (err?: Error | null) => {
                if(err) {
                    connection.send("NO COPY failed, " + err.message, tag);
                    return cb();
                }
                connection.send("OK COPY completed", tag);
                return cb();
            }
        )
    },
    CREATE: (command, cb, connection) => {
        // 用于创建新邮箱
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD CREATE command requires a mailbox", tag);
            return cb();
        }
        const mailbox = args[0];
        connection._server.onCreate(
            connection.session,
            mailbox,
            (err?: Error | null) => {
                if(err) {
                    connection.send("NO CREATE failed, " + err.message, tag);
                    return cb();
                }
                connection.send("OK CREATE completed", tag);
                return cb();
            }
        )
    },
    DELETE: (command, cb, connection) => {
        // 用于删除邮箱
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD DELETE command requires a mailbox", tag);
            return cb();
        }
        const mailbox = args[0];
        connection._server.onDelete(
            connection.session,
            mailbox,
            (err?: Error | null) => {
                if(err) {
                    connection.send("NO DELETE failed, " + err.message, tag);
                    return cb();
                }
                connection.send("OK DELETE completed", tag);
                return cb();
            }
        )
    },
    ENABLE: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection.send("BAD ENABLE not supported", tag);
        return cb();
    },
    EXAMINE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD EXAMINE command requires a mailbox", tag);
            return cb();
        }
        const mailbox = args[0];
        connection._server.onExamine(
            connection.session,
            mailbox,
            (err?: Error | null, {
                exists = 0,
                recent = 0,
                unseen = 0,
                uidValidity = 0,
                uidNext = 0,
                flags = [],

            } = {}) => {
                if(err) {
                    connection.send("NO EXAMINE failed, " + err.message, tag);
                    return cb();
                }
                connection.send(`${exists} EXISTS`);
                connection.send(`${recent} RECENT`);
                connection.send(`OK [UNSEEN ${unseen}]`);
                connection.send(`OK [UIDVALIDITY ${uidValidity}]`);
                connection.send(`OK [UIDNEXT ${uidNext}]`);
                connection.send(`FLAGS (${flags.join(" ")})`);
                connection.send("OK [PERMANENTFLAGS ()]"); // no permanent flags
                connection.send("OK [READ-ONLY] EXAMINE completed", tag);
                return cb();
            }
        );
    },
    EXPUNGE: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection._server.onExpunge(
            connection.session,
            (deletedList: number[], err?: Error | null) => {
                if(err) {
                    connection.send("NO EXPUNGE failed, " + err.message, tag);
                    return cb();
                }
                for(const seq of deletedList) {
                    connection.send(`${seq} EXPUNGE`);
                }
                connection.send("OK EXPUNGE completed", tag);
                return cb();
            }
        )
    },
    FETCH: (command, cb, connection) => {
        // 用于获取邮件信息
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD FETCH command requires a sequence set and a message data item", tag);
            return cb();
        }
        const sequenceSet = args[0];
        const messageDataItem = args[1];
        // parser sequence set
        // seq set可能是一个数字，也可能是一个范围
        // 包含逗号，则是多个序列号
        let seq: number[] | "*"
        if(sequenceSet === "*") {
            seq = "*";
        } else {
            // 要兼顾即存在逗号有存在冒号的情况，逗号的优先级高
            let seqs:number[] = []
            sequenceSet.split(",").map(item => {
                if(item.includes(":")) {
                    const [start, end] = item.split(":");
                    for(let i = parseInt(start); i <= parseInt(end); i++) {
                        seqs.push(i);
                    }
                } else {
                    seqs.push(parseInt(item));
                }
            })
            seq = seqs;
        }
        if(seq !== "*" && seq.length === 0) {
            connection.send("BAD FETCH command requires a sequence set", tag);
            return cb();
        }
        // 解析messageDataItem
        let messageData: string[]

        // messageDataItem可能是如下的格式
        // (key value key2 (value1 value2) key3 value3)
        // 也可能是一个单独的key
        if(messageDataItem.startsWith("(")) {
            messageData = [];
            let stack = []; // 用于存储嵌套的键
            let currentKey = ''; // 当前正在解析的键
            for (let i = 1; i < messageDataItem.length - 1; i++) {
                const char = messageDataItem[i];
                if (char === '(') { // 遇到左括号，表示开始解析嵌套的键
                    stack.push(currentKey); // 将当前键存入栈中
                    currentKey = ''; // 重置当前键
                } else if (char === ')') { // 遇到右括号，表示结束解析嵌套的键
                    if (currentKey !== '') { // 如果当前键不为空，则将其存入messageData中
                        messageData.push(currentKey);
                        currentKey = '';
                    }
                    const values = stack.pop()!.split(' '); // 从栈中取出上一级键，并将其拆分为多个值
                    messageData.push(...values); // 将这些值存入messageData中
                } else if (char === ' ') { // 遇到空格，表示当前键解析完成
                    if (currentKey !== '') { // 如果当前键不为空，则将其存入messageData中
                        messageData.push(currentKey);
                        currentKey = '';
                    }
                } else { // 遇到其他字符，表示当前正在解析键的名称
                    currentKey += char;
                }
            }
            if (currentKey !== '') { // 解析完成后，如果当前键不为空，则将其存入messageData中
                messageData.push(currentKey);
            }
        } else {
            messageData = [messageDataItem];
        }
        if(messageData.length === 0) {
            connection.send("BAD FETCH command requires a message data item", tag);
            return cb();
        }

        connection._server.onFetch(
            connection.session,
            seq,
            messageData,
            (err?: Error | null, messages?: {
                seq: number,
                message: string
            }[]) => {
                if(err) {
                    connection.send("NO FETCH failed, " + err.message, tag);
                    return cb();
                }
                for(const message of messages!) {
                    connection.send(`${message.seq} FETCH (${message.message})`);
                }
                connection.send("OK FETCH completed", tag);
                return cb();
            }
        )



        

    },
    ID: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection.send("NO ID not supported", tag);
        return cb();
    },
    IDLE: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        if(!connection._isSuport("IDLE")) {
        connection.send("BAD IDLE not supported", tag);
            return cb();
        }
        connection._socket.write("+ IDLE accepted, waiting for DONE command\r\n");
        const _onIdle = (
            command: string, 
            cb: (...args: any[]) => void, 
            connection: IMAPConnection
        ) => {
            if(command === "DONE") {
                connection.send("OK IDLE completed", tag);
                return cb();
            }
            connection._server.onIdle(
                connection.session,
                (msg: string, err?: Error | null) => {
                    if(err) {
                        connection._onTimeout();
                    }
                    connection.send(msg);
                }
            )
            cb();
        }
        connection._nextHandler = _onIdle.bind(connection);
        return cb();
    },
    LIST: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD LIST command requires a mailbox", tag);
            return cb();
        }
        const referenceName = args[0];
        const mailboxName = args[1] || "*";
        connection._server.onList(
            connection.session,
            referenceName,
            mailboxName,
            (err?: Error | null, mailboxes?: {
                hasChildren: boolean,
                canSelect: boolean,
                marked: boolean,
                noinferiors: boolean,
                splitChar: string,
                name: string,
            }[]) => {
                if(err) {
                    connection.send("NO LIST failed, " + err.message, tag);
                    return cb();
                }
                for(const mailbox of mailboxes!) {
                    let flags:string[] = []
                    if(mailbox.hasChildren) {
                        flags.push("\\HasChildren");
                    } else {
                        flags.push("\\HasNoChildren");
                    }
                    if(mailbox.canSelect) {
                        flags.push("\\Marked");
                    } else {
                        flags.push("\\Unmarked");
                    }
                    if(mailbox.noinferiors) {
                        flags.push("\\Noinferiors");
                    }
                    if(!mailbox.canSelect) {
                        flags.push("\\Noselect");
                    }
                    connection.send(`LIST (${flags.join(" ")}) "${mailbox.splitChar}" "${mailbox.name}"`);
                }
                connection.send("OK LIST completed", tag);
                return cb();
            }
        )
    },
    LOGIN: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD LOGIN command requires a username and a password", tag);
            return cb();
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
                connection._authed = true;
                return cb();
            }
        )
    },
    LOGOUT: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection._server.onLogout(
            connection.session,
            (err?: Error | null) => {
                if(err) {
                    // should not happen, ignore it
                }
                connection.send("OK LOGOUT completed", tag);
                return connection._onClose();
                
            }
        );
    },
    LSUB: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD LSUB command requires a mailbox", tag);
            return cb();
        }
        const referenceName = args[0];
        const mailboxName = args[1] || "*";
        connection.send("NO LSUB not supported", tag);
        return cb();
    },
    NOOP: (command, cb, connection) => {
        const [tag, cmd]= command.split(" ");
        connection.send("OK NOOP completed", tag);
        return cb();
    },
    RENAME: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD RENAME command requires a source mailbox and a destination mailbox", tag);
            return cb();
        }
        const sourceMailbox = args[0];
        const destinationMailbox = args[1];
        connection._server.onRename(
            connection.session,
            sourceMailbox,
            destinationMailbox,
            (err?: Error | null) => {
                if(err) {
                    connection.send("NO RENAME failed, " + err.message, tag);
                    return cb();
                }
                connection.send("OK RENAME completed", tag);
                return cb();
            }
        )
    },
    SEARCH: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD SEARCH command requires a search term", tag);
            return cb();
        }
        connection._server.onSearch(
            connection.session,
            args,
            (err?: Error | null, result?: number[]) => {
                if(err) {
                    connection.send("NO SEARCH failed, " + err.message, tag);
                    return cb();
                }
                connection.send(result!.join(" "), tag);
                return cb();
            }
        )
    },
    SELECT: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD SELECT command requires a mailbox", tag);
            return cb();
        }
        const mailbox = args[0].slice(1, -1);
        connection._server.onSelect(
            connection.session,
            mailbox,
            (err?: Error | null, {
                exists = 0,
                recent = 0,
                unseen = 0,
                uidValidity = 0,
                uidNext = 0,
                flags = [],
            } = {}) => {
                if(err) {
                    connection.send("NO SELECT failed, " + err.message, tag);
                    return cb();
                }
                connection.send(`${exists} EXISTS`);
                connection.send(`${recent} RECENT`);
                connection.send(`OK [UNSEEN ${unseen}]`);
                connection.send(`OK [UIDVALIDITY ${uidValidity}]`);
                connection.send(`OK [UIDNEXT ${uidNext}]`);
                connection.send(`FLAGS (${flags.join(" ")})`);
                connection.send("OK [PERMANENTFLAGS ()]"); // no permanent flags
                connection.send("OK [READ-WRITE] SELECT completed", tag);
                return cb();
            }
        )
        
    },
    STATUS: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD STATUS command requires a mailbox and a status data item", tag);
            return cb();
        }
        const mailbox = args[0];
        const statusDataItem = args.slice(1);
        // 处理括号的情况
        if(statusDataItem.length === 1) {
            statusDataItem[0] = statusDataItem[0].slice(1, -1);
        } else {
            statusDataItem[0] = statusDataItem[0].slice(1)
            statusDataItem[statusDataItem.length - 1] = statusDataItem[statusDataItem.length - 1].slice(0, -1)
        }
        
        connection._server.onStatus(
            connection.session,
            mailbox,
            statusDataItem,
            (err?: Error | null, result?: {
                item: string,
                value: string | number
            }[]) => {
                if(err) {
                    connection.send("NO STATUS failed, " + err.message, tag);
                    return cb();
                }
                connection.send(`STATUS ${mailbox} (${result!.map(item => `${item.item} ${item.value}`).join(" ")})`);
                connection.send("OK STATUS completed", tag);
                return cb();
            }
        )
    },
    STORE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 3) {
            connection.send("BAD STORE command requires a sequence set, a message data item and a value", tag);
            return cb();
        }
        const sequenceSet = args[0];
        const mode = args[1];
        const value = args.slice(2);
        // parser sequence set
        // seq set可能是一个数字，也可能是一个范围
        // 包含逗号，则是多个序列号
        let seq: number[] | "*"
        if(sequenceSet === "*") {
            seq = "*";
        } else {
            // 要兼顾即存在逗号有存在冒号的情况，逗号的优先级高
            let seqs:number[] = []
            sequenceSet.split(",").map(item => {
                if(item.includes(":")) {
                    const [start, end] = item.split(":");
                    for(let i = parseInt(start); i <= parseInt(end); i++) {
                        seqs.push(i);
                    }
                } else {
                    seqs.push(parseInt(item));
                }
            })
            seq = seqs;
        }
        if(seq !== "*" && seq.length === 0) {
            connection.send("BAD STORE command requires a sequence set", tag);
            return cb();
        }
        
        // 处理mode
        if(!["FLAGS", "+FLAGS", "-FLAGS"].includes(mode)) {
            connection.send("BAD STORE command requires a mode", tag);
            return cb();
        }

        // 处理value
        if(value.length === 0) {
            connection.send("BAD STORE command requires a value", tag);
            return cb();
        }
        // 处理括号的情况
        if(value.length === 1) {
            value[0] = value[0].slice(1, -1);
        } else {
            value[0] = value[0].slice(1)
            value[value.length - 1] = value[value.length - 1].slice(0, -1)
        }

        connection._server.onStore(
            connection.session,
            seq,
            mode,
            value,
            (err?: Error | null, result?: {
                id: number,
                flags: string[]
            }[]) => {
                if(err) {
                    connection.send("NO STORE failed, " + err.message, tag);
                    return cb();
                }
                for(const item of result!) {
                    connection.send(`${item.id} FETCH (${item.flags.join(" ")})`);
                }
                connection.send("OK STORE completed", tag);
                return cb();
            }
        )
    },
    SUBSCRIBE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD SUBSCRIBE command requires a mailbox", tag);
            return cb();
        }
        connection.send("NO SUBSCRIBE not supported", tag);
        return cb();
    },
    UID: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 2) {
            connection.send("BAD UID command requires a command and a sequence set", tag);
            return cb();
        }
        const commandName = args[0];
        const canCommand = ["COPY", "FETCH", "SEARCH", "STORE"];
        if(!canCommand.includes(commandName)) {
            connection.send("BAD UID command requires a command", tag);
            return cb();
        }
        const c = `${tag} ${commandName} ${args.slice(1).join(" ")}`;
        
        // 调用handler中的对应方法
        const fn = handler[commandName]
        if(fn){
            return fn.call(this, c, cb, connection);
        }
        connection.send("BAD UID command requires a command", tag);
        return cb();
    },
    UNSUBSCRIBE: (command, cb, connection) => {
        const [tag, cmd, ...args]= command.split(" ");
        if(args.length < 1) {
            connection.send("BAD UNSUBSCRIBE command requires a mailbox", tag);
            return cb();
        }
        connection.send("NO UNSUBSCRIBE not supported", tag);
        return cb
    }

}