import type { Request, Response } from 'express'

export const apis:{
    method: "GET" | "POST",
    path: string,
    handler: (req: Request, res: Response) => void
}[] = [
    // example
    // {
    //     method: "GET",
    //     path: "/auth",
    //     handler: (req, res) => {
    //         res.send("auth success");
    //     }
    //}
    {//登录验证
        method: "POST",
        path: "/login",
        handler: (req, res) => { 
            res.send("Not Implemented");
        }
    },
    {//登出
        method: "POST",
        path: "/logout",
        handler: (req, res) => { 
            res.send("Not Implemented");
        }
    },
    {//IMAP CHECK
        method: "POST",
        path: "/check",
        handler: (req, res) => { 
            res.send("");
        }
    },
    {//IMAP BOXCLOSE
        method: "POST",
        path: "/boxclose",
        handler: (req, res) => { 
            res.send("Not Implemented");
        }
    },
    {//IMAP FETCH
        method: "POST",
        path: "/fetch",
        handler: (req, res) => { 
            res.send("Not Implemented");
        }
    }
];