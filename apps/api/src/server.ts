import {app} from './app'; app.listen(Number(process.env.API_PORT||4000),()=>console.log('API listening on 4000'));
