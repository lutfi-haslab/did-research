import * as jwt from 'jwt-simple';

const SECRET = "rahasia_banget";

export const encodeJwt = (payload: any) => {
    return jwt.encode(payload, SECRET);
};

export const decodeJwt = (token: string) => {
    return jwt.decode(token, SECRET);
};