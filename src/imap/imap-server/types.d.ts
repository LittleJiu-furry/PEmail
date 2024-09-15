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

    onAuth?: (username: string, password: string) => boolean;
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
    
}