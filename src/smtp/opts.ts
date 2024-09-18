import type { SMTPServerOptions } from 'smtp-server'
import axios from 'axios'
import log from "../log"
import { confs } from '../conf'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import fs from 'fs'
// @ts-expect-error
import spfCheck from 'spf-check'

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
        const transport = nodemailer.createTransport({
            streamTransport: true,
            buffer: true
        })
        stream.on('data', (chunk) => {
            data += chunk
        })
        stream.on('end', async () => {
            // 处理数据
            const mail = await simpleParser(data)
            let sendInfo:{
                from: string,
                to: string[]
            } = {
                from: "",
                to: []
            }
            // 校验发件人
            if (!mail.from) {
                sendInfo.from = session.envelope.mailFrom ? session.envelope.mailFrom.address.toString() : ''
            } else {
                sendInfo.from = mail.from.value[0].address as unknown as string
            }

            // 检查收件人
            if(!mail.to){
                sendInfo.to = session.envelope.rcptTo ? session.envelope.rcptTo.map(v => v.address) : []
            } else {
                if(Array.isArray(mail.to)){
                    sendInfo.to = mail.to.map(v => v.value.map(a => a.address as unknown as string)).flat()
                } else {
                    sendInfo.to = mail.to.value.map(v => v.address as unknown as string)
                }
            }

            transport.sendMail({
                from: sendInfo.from,
                to: sendInfo.to,
                subject: mail.subject || '',
                html: mail.html || mail.text || '',
                // attachments: mail.attachments.map(fileInfo => {
                //     return {
                //         filename: fileInfo.filename,
                //         content: fileInfo.content,
                //         contentType: fileInfo.contentType
                //     }
                // })
            }, (err, info) => {
                if (err) {
                    log.error(err)
                    return callback(err)
                }
                fs.writeFileSync("mail.eml", info.message.toString())
                return callback(null)
            })
        })

    },
    onMailFrom: async (address, session, callback) => {
        log.debug("Mail from " + session.user)
        const SPFCheck = async (domain: string, ip:string): Promise<{
            pass: boolean,
            state: string
        }> => {
            return new Promise(async (resolve) => {
                
                const result = spfCheck(ip, domain)
                resolve({
                    pass: result == spfCheck.Pass,
                    state: await result
                })

                
            })
        }
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
            
            // 对来信的外域用户进行SPF验证
            const SPF = await SPFCheck(domain, session.remoteAddress)
            if(SPF.pass){
                return callback()
            } 
            return callback(new Error('SPF check failed, reject email, reason: SPF check returns ' + SPF.state))

        } else {
            // 登录态，来自本域的链接
            // 本域用户在发送时不能伪造发件人
            const userEmail = address.address.trim()
            if (address.address !== userEmail) {
                return callback(new Error('Sender address must be the same as the login user'))
            }
            return callback()
        }
    },
    onRcptTo: (address, session, callback) => {
        // 是否处于登录状态
        if (!session.user){
            // 没登陆，来自外域的链接
            // 收件人地址只能在本域
            if (address.address.split('@')[1] !== confs.myDomain) {
                return callback(new Error('Reject email which not send to this domain'))
            }
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