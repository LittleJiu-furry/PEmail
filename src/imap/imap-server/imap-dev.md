# imap-server开发记录
这个项目参考了nodemailer中smtp-server的实现，实现了一个简单的imap服务器。

对于每一个链接，都会创建一个对应的Connection对象，这个对象用于处理解析IMAP命令，以及发送响应。