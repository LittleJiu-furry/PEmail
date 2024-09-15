import type { Socket, IMAPSession } from "./types";
import type { IMAPServer } from "./imap-server"
import { EventEmitter } from "node:events";
import crypto from "crypto";
import { IMAPStream } from "./imap-stream";
import { handler as hd } from "./imap-handler";

export class IMAPConnection extends EventEmitter {
    id: string;
    _server: IMAPServer;
    _socket: Socket;
    session: IMAPSession;
    _parser: IMAPStream
    _ready: boolean;
    _nextHandler: boolean | ((...args: any[]) => void);
    _unrecognizedCommandsCount: number;
    _needLoginCommands: string[] = [
        "SELECT",
        "EXAMINE",
        "CREATE",
        "DELETE",
        "RENAME",
        "SUBSCRIBE",
        "UNSUBSCRIBE",
        "LIST",
        "LSUB",
        "STATUS",
        "APPEND",
        "CHECK",
        "CLOSE",
        "EXPUNGE",
        "SEARCH",
        "FETCH",
        "STORE",
        "COPY",
        "UID",
        "NOOP",
        "LOGOUT",
    ];
    _blockedCommands: string[] = [];


    constructor(
        server: IMAPServer,
        socket: Socket,
        options: {[key: string]: any}
    ) {
        super();

        options = options || {};

        this.id = options.id || crypto.randomBytes(16).toString("hex").toLowerCase();
        this._server = server;
        this._socket = socket;
        this._parser = new IMAPStream();
        this._parser.onCommand = (buf, callback) => this._onCommand(buf, callback);
        this._ready = false;
        this._nextHandler = false;
        this._unrecognizedCommandsCount = 0;
        this.session = {}
    
    
    }

    init() {
        this._setListeners(() => {
            if (this._server.options.maxConnections && this._server.connections.size > this._server.options.maxConnections) {
                this.send("NO Too many connections, try again later");
                this._onClose();
                return;
            }

            setTimeout(() => this.connectionReady(), 100)
        })
    }

    connectionReady(next?: () => void) {
        this.send("OK IMAP4rev1 Service Ready, Fur Email Server Welcome You");
        this._ready = true;
        this.session = {
            ...this.session,
            connectionID: this.id,
            localAddress: this._socket.localAddress,
            localPort: this._socket.localPort,
            remoteAddress: this._socket.remoteAddress,
            remotePort: this._socket.remotePort,
        }
        this.emit("connect", {
            id: this.id,
            localAddress: this._socket.localAddress,
            localPort: this._socket.localPort,
            remoteAddress: this._socket.remoteAddress,
            remotePort: this._socket.remotePort,
        })
        if(next) {
            next();
        }
    }

    send(data: any, tag?: string) {
        if(tag) {
            data = `${tag} ${data}`;
        } else {
            data = `* ${data}`;
        }

        if(this._socket && !this._socket.destroyed) {
            this._socket.write(data + "\r\n");
        }
    }

    _setListeners(callback: () => void) {
        this._socket.on("close", hadError => this._onCloseEvent(hadError))
        this._socket.on("error", err => this._onError(err))
        this._socket.setTimeout(this._server.options.timeout || 60000, () => this._onTimeout())
        this._socket.pipe(this._parser)
        callback();
    }

    _onCloseEvent(hadError: boolean) {
        this._onClose();
    }

    _onClose() {
        // 从服务器的连接列表中移除
        this._server.connections.delete(this);
        setImmediate(() => {
            const ret = this._server.onClose(this.session)
            this._socket.end();
            return ret;
        })
    }

    _onError(err: Error) {
        this.emit("error", err);
    }

    _onTimeout() {
        this.send("BYE Autologout; idle for too long");
        this._onClose();
    }

    _onCommand(command: Buffer, callback: () => void) {
        console.log((command || '').toString().split(" "));
        
        const [tag, cmd, ...args] = (command || '').toString().split(" ");

        if(!this._ready){
            this.send("BAD not ready", tag);
            this._onClose();
        }

        if (/^(OPTIONS|GET|HEAD|POST|PUT|DELETE|TRACE|CONNECT) \/.* HTTP\/\d\.\d$/i.test(cmd)) {
            return this.send('BAD Invalid IMAP command, HTTP requests not allowed', tag);
        }

        callback = callback || (() => false);

        let handler: (...args: any[]) => void;
        if (this._nextHandler && typeof this._nextHandler === "function") {
            handler = this._nextHandler;
            this._nextHandler = false;
        } else {
            console.log(cmd);
            
            handler = hd[cmd.toUpperCase()];
        }

        if(!handler){
            this._unrecognizedCommandsCount++;
            if(this._unrecognizedCommandsCount > 10) {
                this.send("BAD Too many unrecognized commands", tag);
                this._onClose();
                return;
            }
            this.send("BAD Invalid command", tag);
            return setImmediate(callback);
        }

        // 封锁用户在未登录状态下的指令
        if(
            !this.session.user &&
            !["LOGIN", "AUTHENTICATE", "CAPABILITY", "NOOP", "LOGOUT"].includes(cmd)
        ) {
            this._unrecognizedCommandsCount++;
            if(this._unrecognizedCommandsCount > 10) {
                this.send("BAD Too many unrecognized commands", tag);
                this._onClose();
                return;
            }
        }

        if(
            !this.session.user &&
            cmd && 
            this._needLoginCommands.includes(cmd)
        ) {
            this.send("NO Please login first", tag);
            return setImmediate(callback);
        }

        handler.call(this, command, callback, this);
    }

    _onEvent(eventName: string, ...args: any[]) {
        this._server.emit(eventName, this.session, ...args);
    }

    _isSuport(commandName: string) {
        return this._blockedCommands.includes(commandName);
    }

}