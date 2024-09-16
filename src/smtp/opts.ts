import type { SMTPServerAuthentication, SMTPServerOptions } from 'smtp-server'
import axios from 'axios'
import nodemailer from 'nodemailer'
import log from "../log"
import { confs } from '../conf'

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
            
             // 返回信息
            callback(null)
        })

    },
    onMailFrom: (address, session, callback) => {
        log.debug("Mail from " + session.user)
        // 是否处于登录状态
        if (!session.user) {
            // 非登录态，来自外域的链接
            // 来自外域的链接
            // 对整体进行验证, 验证发件人是否位于全局黑名单和用户黑名单中
            
            // if(isBlack(address.address)){
            //     return callback(new Error('Blacklist user, reject email'))
            // }

            // 从发件人地址中提取域名
            // 判断是否位于全局黑名单域名和用户黑名单域名中
            const [_, domain] = address.address.split('@')
            // if(isBlack(domain)){
            //     return callback(new Error('Blacklist domain, reject email'))
            // }
            return callback()

        } else {
            // 登录态，来自本域的链接
            const userEmail = `${session.user}@${confs.myDomain}`
            // 本域用户在发送时不能伪造发件人
            if (address.address !== userEmail) {
                return callback(new Error('Sender address must be the same as the login user'))
            }
            return callback()
        }
    },
    onRcptTo: (address, session, callback) => {
        // 是否处于登录状态
        if (!session.user){

        } else {
            
        }
        callback()
    },
    onClose: (session) => {
        
    },
    onConnect: (session, callback) => {
        log.debug("SMTP Connection from " + session.hostNameAppearsAs)
        callback()
    },
}

export default opts