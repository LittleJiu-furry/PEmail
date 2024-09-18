import net from "net";
import { EventEmitter } from "node:events";
import tls from "tls";
import { IMAPServerOptions, IMAPSession } from "./types";
import os from "os";
import crypto from "crypto";
import { IMAPConnection } from "./imap-connection";


export class IMAPServer extends EventEmitter {
    options: IMAPServerOptions;
    server: net.Server | tls.Server;
    disabledCommands: string[];
    connections: Set<any>;

    constructor(options?: IMAPServerOptions) {
        super();
        this.options = options || {};
        
        // Setup default options
        this._updateOptions();

        // Setup listen functions
        this.setListenFunctions();

        this.connections = new Set();

        // Setup disabled commands
        this.disabledCommands = [];
        if (this.options.hideSTARTTLS) {
            this.disabledCommands.push("STARTTLS");
        }
        

        // Create server
        if (this.options.useSSL) {
            this.server = tls.createServer(
                this.options.tlsOptions!,
                (socket) => {
                   this._initSocket(
                    socket,
                    (err, socketOptions) => {
                        if (err) {
                            // ignore, should not happen
                        }
                        this.connect(socket, socketOptions);
                    }
                   )
                }
            )
        } else {
            this.server = net.createServer(
                (socket) => {
                    this._initSocket(
                        socket,
                        (err, socketOptions) => {
                            if (err) {
                                // ignore, should not happen
                            }
                            this.connect(socket, socketOptions);
                        }
                    )
                }
            )
        }
        

    }

    _updateOptions() {
        // set servername
        this.options.servername = this.options.servername || os.hostname();
        
        // set maxConnections, 0 means unlimited
        this.options.maxConnections = this.options.maxConnections || 0;

        // set timeout, in milliseconds
        this.options.timeout = this.options.timeout || 60000;

        // set secure
        this.options.secure = this.options.secure !== undefined ? this.options.secure : true; 

        // set useTls
        this.options.useSSL = this.options.useSSL || false;

        // set tlsOptions
        this.options.tlsOptions = this.options.tlsOptions || {};

        // set hideSTARTTLS
        // if useSSL is true, hideSTARTTLS is true
        if(this.options.useSSL) {
            this.options.hideSTARTTLS = true;
        } else {
            this.options.hideSTARTTLS = this.options.hideSTARTTLS || false;
        }

        // set debugLogger
        this.options.debugLogger = this.options.debugLogger || null;


        
    }

    setListenFunctions() {
        // 提取opt中所有的on开头的函数
        const opt = this.options;
        const keys = Object.keys(opt);
        const listenFunctions = keys.filter(key => key.startsWith("on"));
        listenFunctions.forEach((key) => {
            const fn = (opt as any)[key];
            // 判断是否为函数
            if(fn && typeof fn === "function") {
                (this as any)[key] = (opt as any)[key];
            }
            // 否则不替换，使用类内默认的函数
        });
    }
    
    _initSocket(
        socket: net.Socket | tls.TLSSocket,
        callback: (
            err: Error | null,
            socketOptions: {}
        ) => void
    ) {
        let socketOptions = {
            id: crypto.randomBytes(16).toString("hex").toLowerCase(),
        };
        callback(null, socketOptions);
    }



    connect(
        socket: net.Socket | tls.TLSSocket,
        socketOptions: {},
    ) {
        const connection = new IMAPConnection(this, socket, socketOptions, this.options.debugLogger);
        this.connections.add(connection);
        connection.on("error", (session, err) => this._onError(session, err))
        connection.on("connect", (data) => this._onClientConnect(data));
        connection.init();
    }
    
    onConnect(session: IMAPSession) {
        // do nothing
    }
    
    onError(session: IMAPSession,err: Error) {
        this.options.debugLogger && this.options.debugLogger.error(`[Connection: ${session.connectionID}] ${err.message}`);
    }

    // Event Emiters
    _onError(session:IMAPSession, err: Error) {
        this.onError(session, err);
    }

    _onClientConnect(data: any) {
        this.onConnect(data);
    }


    listen(...args: any[]) {
        this.server.listen(...args);
    }

    // IMAPServer Handlers
    onClose(session: any) {
        // do nothing
    }

    onAppend(
        session: IMAPSession,
        mailbox: string,
        flags: string[],
        date: string,
        size: number,
        message: string,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback);
    }

    onAuth(
        auth:{
            method: string,
            username: string,
            password?: string,
            accessToken?: string,
        },
        session: IMAPSession,
        callback: (err?: Error | null, respone?: any) => void
    ) {
        setImmediate(callback, null, {user: auth.username});
    }

    onCheck(
        session: IMAPSession, 
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback);
    }

    onBoxClose(
        session: IMAPSession,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback);
    }

    onCopy(
        session: IMAPSession,
        sourceMailbox: string,
        destinationMailbox: string,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onCreate(
        session: IMAPSession,
        mailbox: string,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onDelete(
        session: IMAPSession,
        mailbox: string,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onExamine(
        session: IMAPSession,
        mailbox: string,
        callback: (err?: Error | null, result?: {
            exists?: number,
            recent?: number,
            unseen?: number,
            uidValidity?: number,
            uidNext?: number,
            flags?: string[],
        }) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onExpunge(
        session: IMAPSession,
        callback: (deletedList: number[], err?: Error | null) => void
    ) {
        setImmediate(callback, [], new Error("Not implemented"));
    }

    onFetch(
        session: IMAPSession,
        sequenceSet: number[] | "*",
        items: string[],
        callback: (err?: Error | null, result?: {
            seq: number,
            message: string
        }[]) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onIdle(
        session: IMAPSession,
        callback: (msg: string, err?: Error | null) => void
    ) {
        setImmediate(callback, "", new Error("Not implemented"));
    }

    onList(
        session: IMAPSession,
        reference: string,
        mailbox: string,
        callback: (err?: Error | null, result?: {
            hasChildren: boolean,
            canSelect: boolean,
            marked: boolean,
            noinferiors: boolean,
            splitChar: string,
            name: string,
        }[]) => void
    ) {
        if(mailbox === "*") {
            return callback(null, [{
                hasChildren: false,
                canSelect: true,
                marked: false,
                noinferiors: true,
                splitChar: "/",
                name: "INBOX",
            }]);
        } else {
            setImmediate(callback, new Error("Not implemented"));
        }
    }

    onLogout(
        session: IMAPSession,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback);
    }

    onRename(
        session: IMAPSession,
        oldMailbox: string,
        newMailbox: string,
        callback: (err?: Error | null) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onSearch(
        session: IMAPSession,
        searchArgs: string[],
        callback: (err?: Error | null, result?: number[]) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onSelect(
        session: IMAPSession,
        mailbox: string,
        callback: (err?: Error | null, result?: {
            exists?: number,
            recent?: number,
            unseen?: number,
            uidValidity?: number,
            uidNext?: number,
            flags?: string[],
        }) => void
    ) {
        if(mailbox === "INBOX") {
            return callback(null, {
                exists: 0,
                recent: 0,
                unseen: 0,
                uidValidity: 0,
                uidNext: 0,
                flags: [],
            });
        }
        setImmediate(callback, new Error("Not implemented"));
    }

    onStatus(
        session: IMAPSession,
        mailbox: string,
        items: string[],
        callback: (err?: Error | null, result?: {
            item: string,
            value: string | number
        }[]) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }

    onStore(
        session: IMAPSession,
        sequenceSet: number[] | "*",
        action: string,
        flags: string[],
        callback: (err?: Error | null, result?: {
            id: number,
            flags: string[]
        }[]) => void
    ) {
        setImmediate(callback, new Error("Not implemented"));
    }


    


}