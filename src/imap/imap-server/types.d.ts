import tls from "tls";
import net from "net";

export interface IMAPServerOptions extends tls.TlsOptions {
    /**
     * This server name default to hostname
     */
    servername?: string;
    /**
     * Maximum number of connections, 0 means unlimited
     */
    maxConnections?: number;
    /**
     * Timeout in milliseconds, default to 60000
     */
    timeout?: number;
    /**
     * If set true, the server can upgrade to secure connection
     * Default to true
     */
    secure?: boolean;
    /**
     * If set true, the server will use SSL
     * Default to false
     */
    useSSL?: boolean;
    /**
     * TLS options
     */
    tlsOptions?: tls.TlsOptions;

    /**
     * If set true, the server will hide STARTTLS command
     * and will not allow to upgrade to secure connection
     * Default to false
     */
    hideSTARTTLS?: boolean;

    /**
     * If set it, ther server will use this logger
     */
    debugLogger?: any;

    onConnect?: (session: IMAPSession) => void;
    onError?: (err: Error, session: IMAPSession) => void;
    onAppend?: (session: IMAPSession, mailbox: string, flags: string[], date: Date, message: string, callback: (err?: Error | null) => void) => void;
    onAuth?: (auth: AuthObject, session: IMAPSession, callback: (err: Error | null, respone:{user: string}) => void) => void;
    onClose?: (session: IMAPSession) => void;
    onCheck?: (session: IMAPSession, callback: (err?: Error | null) => void) => void;
    onBoxClose?: (session: IMAPSession, callback: (err?: Error | null) => void) => void;
    onCopy?: (session: IMAPSession, sourceMailbox: string, destinationMailbox: string, callback: (err?: Error | null) => void) => void;
    onCreate?: (session: IMAPSession, mailbox: string, callback: (err?: Error | null) => void) => void;
    onDelete?: (session: IMAPSession, mailbox: string, callback: (err?: Error | null) => void) => void;
    
    onExamine?: (session: IMAPSession, mailbox: string, callback: (err?: Error | null, result?: {
        exists?: number,
        recent?: number,
        unseen?: number,
        uidValidity?: number,
        uidNext?: number,
        flags?: string[],
    }) => void) => void;
    onExpunge?: (session: IMAPSession, callback: (deletedList: number[], err?: Error | null) => void) => void;
    onFetch?: (session: IMAPSession, sequenceSet: number[] | "*", items: string[], callback: (err?: Error | null, result?: {
        seq: number,
        message: string
    }[]) => void) => void;
    onIdle?: (session: IMAPSession, callback: (msg: string, err?: Error | null) => void) => void;
    onList?: (session: IMAPSession, reference: string, mailbox: string, callback: (err?: Error | null, result?: {
        hasChildren: boolean,
        canSelect: boolean,
        marked: boolean,
        noinferiors: boolean,
        splitChar: string,
        name: string,
    }[]) => void) => void;
    onLogout?: (session: IMAPSession, callback: (err?: Error | null) => void) => void;
    onRename?: (session: IMAPSession, oldMailbox: string, newMailbox: string, callback: (err?: Error | null) => void) => void;
    onSearch?: (session: IMAPSession, searchArgs: string[], callback: (err?: Error | null, result?: number[]) => void) => void;
    onSelect?: (session: IMAPSession, mailbox: string, callback: (err?: Error | null, result?: {
        exists?: number,
        recent?: number,
        unseen?: number,
        uidValidity?: number,
        uidNext?: number,
        flags?: string[],
    }) => void) => void;
    onStatus?: (session: IMAPSession, mailbox: string, items: string[], callback: (err?: Error | null, result?: {
        item: string,
        value: string | number
    }[]) => void) => void;
    onStore?: (session: IMAPSession, sequenceSet: number[] | "*", mode: string, items: string[], callback: (err?: Error | null, result?: {
        id: number,
        flags: string[]
    }[]) => void) => void;






}

interface AuthObject {
    user: string;
    password: string;
    password?: string;
    accessToken?: string;
}

type Socket = net.Socket | tls.TLSSocket;


/**
 * All properties is optional
 */
export interface IMAPSession {

    user?: string;
    connectionID?: string;
    session?: any;
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    currentBox?: string;
    
}