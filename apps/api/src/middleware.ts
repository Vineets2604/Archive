import {Request,Response,NextFunction} from 'express'; import {verifyToken} from './auth';
declare global { namespace Express { interface Request { userId?: string } } }
export function auth(req:Request,res:Response,next:NextFunction){const h=req.headers.authorization; if(!h?.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'}); try{req.userId=String(verifyToken(h.slice(7)).sub); next()}catch{return res.status(401).json({error:'Invalid token'})}}
export function optionalAuth(req:Request,_res:Response,next:NextFunction){const h=req.headers.authorization;if(h?.startsWith('Bearer ')){try{req.userId=String(verifyToken(h.slice(7)).sub)}catch{}}next()}
