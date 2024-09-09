import type { SMTPServerAuthentication, SMTPServerOptions } from 'smtp-server'
import axios from 'axios'
import { simpleParser } from 'mailparser'
import * as emailUtil from './oncemail'

const opts: SMTPServerOptions = {
    onAuth: async (auth, session, callback) => {
        
        // 向验证服务器发送验证请求
        const authInfo = {
            user: auth.username,
            pass: auth.password
        }
        // try {
        //     // 假设验证服务器地址为 http://localhost:3000/auth
        //     const resp = await axios.post('http://localhost:3000/auth', authInfo)
        //         .then(res => res)
            
        //     const jData = resp.data
        //     if (jData.code === 200) {
        //         // 验证成功
        //         callback(null, {
        //             user: jData.data.usernick
        //         })
        //     } else {
        //         // 验证失败
        //         callback(new Error(jData.msg))
        //     }
        // } catch (error) {
        //     callback(new Error('Cannot authenticate, please try again'))
        // }
        
        
        callback(null, {
            user: auth.username
        })
    },
    onData: (stream, session, callback) => {
        let data = ''
        stream.on('data', (chunk) => {
            data += chunk
        })
        stream.on('end', async () => {
            // 处理数据
            const parsed = await simpleParser(data)
                .then(parsed => parsed)
            const instance = emailUtil.getInstance(session.id)
            instance.setSubject(parsed.subject || '')
            instance.setDate(parsed.date ? parsed.date.toDateString() : new Date().toUTCString())
            instance.setMIMEVersion('1.0')
            instance.setBoundary(`${Math.random().toString(36).substring(2, 15)}-${session.id}`)
            instance.setBody({
                contentType: "text/html; charset=utf-8",
                content: parsed.html
            })
             // 返回信息
            callback(null)
        })

    },
    onMailFrom: (address, session, callback) => {
        emailUtil.getInstance(session.id).setFrom(address.address)
        callback()
    },
    onRcptTo: (address, session, callback) => {
        emailUtil.getInstance(session.id).setTo(address.address)
        callback()
    },
    onClose: (session) => {
        
    },
    onConnect: (session, callback) => {
        callback()
    },
}

export default opts