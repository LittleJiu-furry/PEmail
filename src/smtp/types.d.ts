type baseResponse = {
    code: number,
    msg: string,
    data: any
}

type AuthResponse = baseResponse & {
    data: {
        uuid: string,
        token: string,
        usernick: string
    }
}
