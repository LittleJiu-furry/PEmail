import winston from "winston";

export default winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "silly",
            format: winston.format.combine(
                winston.format.colorize({
                    all: true,
                }),
                winston.format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss.SSS",
                }),
                winston.format.printf(info => `[${info.timestamp}] [${info.level}] ${info.message}`)
            )
        }),
        new winston.transports.File({
            dirname: "logs",
            filename: "app.log",
            level: "debug",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => `[${info.timestamp}] [${info.level}] ${info.message}`)
            ),
            maxsize: 1024 * 1024 * 10,
        })
    ]
})