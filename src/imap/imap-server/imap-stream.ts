import { Writable, PassThrough } from "node:stream"

export class IMAPStream extends Writable {
    _dataMode: boolean;
    _reaminder: string;
    constructor(options?: any) {
        super(options || {});

        this._dataMode = false;
        this._reaminder = '';

    }


    _write(
        chunk: any,
        encoding: string,
        callback: (error?: Error | null) => void
    ) {
        if (!chunk || !chunk.length) {
            return callback();
        }

        let called = false;
        const done = (...args: any[]) => {
            if(called) {
                return;
            }
            called = true;
            callback(...args);
        }

        let readPos = 0;

        
        const newLineRegex = /\r?\n/g;
        const data:any = this._reaminder + chunk.toString('binary');
        let line: any;
        const readLine = () => {
            if(this._dataMode) {
                const buf = Buffer.from(data.substr(readPos), 'binary');
                this._reaminder = '';
                return this._write(buf, "buffer", done)
            }

            const match = newLineRegex.exec(data);
            if(match) {
                line = data.substr(readPos, match.index - readPos);
                readPos += line.length + match[0].length;
            } else {
                this._reaminder = readPos < data.length ? data.substr(readPos) : '';
                return done();
            }

            this.onCommand(Buffer.from(line, 'binary'), readLine);
        }

        readLine();
        
    }

    onCommand(line: Buffer, callback: () => void) {
        // do nothing
    }
}