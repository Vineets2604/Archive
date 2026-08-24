const API=import.meta.env.VITE_API_URL||'http://localhost:4000/api';
export const API_ORIGIN=API.replace(/\/api\/?$/,'');
export const assetUrl=(value?:string|null)=>value?.startsWith('/')?`${API_ORIGIN}${value}`:value||'';
export const api=(path:string,options:RequestInit={})=>{const isForm=options.body instanceof FormData;return fetch(API+path,{...options,headers:{...(isForm?{}:{'content-type':'application/json'}),...(options.headers||{}),...(localStorage.token?{authorization:`Bearer ${localStorage.token}`}:{})}}).then(async response=>{if(!response.ok)throw new Error(await response.text());return response.status===204?null:response.json()})};
