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
    // }
];