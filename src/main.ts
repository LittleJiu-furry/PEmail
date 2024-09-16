import * as smtp from "./smtp"
import * as imap from "./imap"

smtp.start({
    serverName: "Fur Email Server",
    key_path: "../../ssl/key.pem",
    cert_path: "../../ssl/cert.pem",
})

imap.start({
    serverName: "Fur Email Server",
    key_path: "../../ssl/key.pem",
    cert_path: "../../ssl/cert.pem",
})