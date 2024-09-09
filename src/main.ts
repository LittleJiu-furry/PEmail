import * as smtp from "./smtp"

smtp.start({
    serverName: "Fur Email Server",
    key_path: "../../ssl/key.pem",
    cert_path: "../../ssl/cert.pem",
})