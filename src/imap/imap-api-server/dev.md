## IMAP-API-Server

IMAP-API-Server is a server that provides an API to interact with IMAP servers. It is built using [Express](https://expressjs.com/) and [Node.js](https://nodejs.org/).

## 接口列表

- 基础路径: `/api/v1`
- 基础响应格式:
  ```json
  {
    "code": 0,
    "message": "",
    "data": {}
  }
  ```

后文不再重复说明基础响应格式，只说明 `data` 字段的内容。

编写接口时，不需要考虑基础路径，基础路径由封装对象提供

除特殊说明的逻辑外，所有接口都请按照响应格式返回如下数据:
```json
{
  "code": -1,
  "message": "Not Implemented",
  "data": null
}
```

### 登录验证
- id: 1
- path: `/login`
- method: `POST`
- request content-type: `application/json`
- request body:
  ```json
  {
    "method": "", // 不需要判断，保留前端原始输入
    "user": "", // 不需要判断，按照邮箱格式分割取用户名
    "token": "" // 不需要判断，保留前端原始输入即可 
  }
  ```

- logic: 
    - 请求访问 Auth Center 的 `/auth` 接口，验证用户的 token 是否有效
    - 不做任何判断，直接返回中心的返回结果

- response content-type: `application/json`

### 登出
- id: 1
- path: `/logout`
- method: `POST`
- request content-type: `application/json`
- request body:
  ```json
  {
    "user": "", // 不需要判断，按照邮箱格式分割取用户名 
  }
  ```
- logic: 
    - 请求访问 Auth Center 的 `/logout` 接口，注销用户的 token
    - 不做任何判断，直接返回中心的返回结果

- response content-type: `application/json`

### IMAP CHECK
- id: 2
- path: `/check`
- method: `POST`
- request content-type: `application/json`
- request body:
  ```json
  {
    "user": "", // 不需要判断，按照邮箱格式分割取用户名
  }
  ```
- logic: 
    - 保留

- response content-type: `application/json`

### IMAP BOXCLOSE
- id: 2
- path: `/boxclose`
- method: `POST`
- request content-type: `application/json`
- request body:
  ```json
  {
    "user": "", // 不需要判断，按照邮箱格式分割取用户名
    "mailbox": "" // 不需要判断，保留前端原始输入
  }
  ```
- logic: 
    - 保留

- response content-type: `application/json`

### IMAP FETCH
- id: 3
- path: `/fetch`
- method: `POST`
- request content-type: `application/json`
- request body:
  ```json
  {
    "user": "", // 不需要判断，按照邮箱格式分割取用户名
    "mailbox": "", // 不需要判断，保留前端原始输入
    "seq": [],
    // "seq": "*"
    "messageDate": []
  }
  ```
- logic:
    - 请检查 `seq` 和 `messageDate` 是否为空，如果为空则返回对应错误(详见[操作码表](#操作码表)), data 为空数组
    - `seq`为`*`或者数字数组，请检查是否合法，如果不合法则返回对应错误(详见[操作码表](#操作码表)), data 为空数组
    - `messageData` 必定为数组，数组内每个字段都是以`key-value`结构导入的对象，对于一个key如果有多个值，那么他一定会是key (key1 value1 key2 value2) 的形式，请进一步解析，并且检查是否合法，如果不合法则返回对应错误(详见[操作码表](#操作码表)), data 为空数组
    - 如果以上检查都通过，则保留，暂时不实现，data 为空数组


## 操作码表

|Code|描述|
|:---:|:---|
|-1|未实现|
|0|成功|
|1001|认证失败|
|1002|用户已退出|
|1003|邮箱不存在|
|1004|邮箱未登录|
|1005|邮箱已登录|
|1006|被封禁的邮箱|
|1007|参数错误|
|------|------|
|2001|参数错误|
|2002|邮箱错误|
|2003|未认证|
|2004|保留，其他未知错误|
|------|------|
|3001|参数错误|
|3002|邮箱错误|
|3003|未认证|
|3004|seq非法|
|3005|messageDate非法|
|3006|保留，其他未知错误|