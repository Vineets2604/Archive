import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';
const secret=()=>process.env.JWT_SECRET||'dev-secret';
export const hashPassword=(p:string)=>bcrypt.hash(p,10); export const comparePassword=(p:string,h:string)=>bcrypt.compare(p,h);
export const signToken=(id:string)=>jwt.sign({sub:id},secret(),{expiresIn:'7d'});
export const verifyToken=(token:string)=>jwt.verify(token,secret()) as jwt.JwtPayload;
