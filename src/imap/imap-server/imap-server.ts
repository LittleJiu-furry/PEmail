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


        
    }

    setListenFunctions() {

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
        const connection = new IMAPConnection(this, socket, socketOptions);
        this.connections.add(connection);
        connection.on("error", (err) => this._onError(err))
        connection.on("connect", (data) => this._onClientConnect(data));
        connection.init();
    }
    
    onClose(session: any) {
        // do nothing
    }

    onAuth(
        auth:{
            method: string,
            username: string,
            password?: string,
            accessToken?: string,
        },
        session: IMAPSession,
        callback: (err: Error | null, user: any) => void
    ) {
        setImmediate(callback, null, {user: auth.username});
    }


    // Event Emiters
    _onError(err: Error) {
        this.emit("error", err);
    }

    _onClientConnect(data: any) {
        this.emit("connect", data);
    }


    listen(...args: any[]) {
        this.server.listen(...args);
    }

    


}