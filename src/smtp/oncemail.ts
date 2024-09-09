type instance = string

interface EmlData {
    from: string
    to: string[]
    subject: string
    Date: string
    MIMEVersion: string
    boundary: string
    body: {
        contentType: string
        content: string
        [key: string]: any // 其他属性
    }[]
}


class Email {
    constructor(instance: instance) {
        this.instance = instance
    }
    instance: instance
    data: EmlData = {
        from: "",
        to: [],
        subject: "",
        Date: "",
        MIMEVersion: "1.0",
        boundary: "",
        body: []
    }
    
    setFrom(from: string) {
        this.data.from = from
    }

    setTo(to: string) {
        this.data.to.push(to)
    }

    setSubject(subject: string) {
        this.data.subject = subject
    }

    setDate(date: string) {
        this.data.Date = date
    }

    setMIMEVersion(version: string) {
        this.data.MIMEVersion = version
    }

    setBoundary(boundary: string) {
        this.data.boundary = boundary
    }

    setBody(body: any) {
        this.data.body.push(body)
    }
    
    getEml() {
        let eml = `From: ${this.data.from}\n`
            + `To: `
        for (const to of this.data.to) {
            eml += `${to}, `
        }
        // 去掉最后一个逗号
        eml = eml.slice(0, -2) + "\n"
        eml += `Subject: ${this.data.subject}\n`
            + `Date: ${this.data.Date}\n`
            + `MIME-Version: ${this.data.MIMEVersion}\n`
            + `Content-Type: mutipart/mixed; boundary="${this.data.boundary}"\n`
            + `\n`
        
        for (const b of this.data.body) {
            eml += `--${this.data.boundary}\n`
            for (const key in b) {
                if(key === "content") {
                    eml += `\n${b[key]}\n\n`
                    continue
                }
                // 按照小驼峰命名法转换为短横线命名法, 但是首字母要求大写
                // 例如: Content-Type => Centtent-Type
                const linkedKey = key.replace(/([A-Z])/g, "-$1")
                const newKey = linkedKey.charAt(0).toUpperCase() + linkedKey.slice(1)
                eml += `${newKey}: ${b[key]}\n`

            }
        }

        return eml
    }
}

const instanceMap: Map<instance, Email> = new Map();

export function getInstance(id: instance): Email {
    if (!instanceMap.has(id)) {
        const instance = new Email(id);
        instanceMap.set(id, instance);
    }
    return instanceMap.get(id)!; // 保证类型安全，非空断言
}

export function removeInstance(id: instance): void {
    instanceMap.delete(id);
}

