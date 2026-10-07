import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGoogleClient } from './lib/google-api.js';
import { createOpenAIService } from './lib/openai-service.js';
import { CATEGORIES, cleanText, validateItemPayload, validateLookAgainstCloset, sanitizeAiLook, normalizeAccessories } from './lib/validators.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const google = createGoogleClient(process.env.GOOGLE_APPS_SCRIPT_URL);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai = createOpenAIService({ openai, textModel:process.env.OPENAI_MODEL || 'gpt-5.6-luna', imageModel:process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst' });
const upload = multer({ storage:multer.memoryStorage(), limits:{fileSize:20*1024*1024}, fileFilter:(_r,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype)) });
app.use(express.json({limit:'25mb'}));

function extractDriveId(value) {
  const url = String(value || '').trim();
  if (!url) return '';

  const query = url.match(/[?&]id=([^&]+)/);
  if (query) return decodeURIComponent(query[1]);

  const filePath = url.match(/\/file\/d\/([^/]+)/);
  if (filePath) return filePath[1];

  return url;
}

async function fetchDriveImage(value) {
  const id = extractDriveId(value);
  if (!id) throw new Error('Falta el ID de la imagen.');

  const imageUrl =
    'https://drive.google.com/thumbnail?id=' +
    encodeURIComponent(id) +
    '&sz=w1600';

  const response = await fetch(imageUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la imagen.');
  }

  const contentType =
    response.headers.get('content-type') || '';

  if (!contentType.startsWith('image/')) {
    throw new Error('Google Drive no devolviÃ¯Â¿Â½ una imagen.');
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.split(';')[0]
  };
}

async function serveDriveImage(req, res, id) {
  try {
    const image = await fetchDriveImage(id);

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.end(image.buffer);
  } catch (error) {
    return res.status(502).send(
      error.message || 'Error al obtener la imagen.'
    );
  }
}
app.get('/api/image', (req, res) => serveDriveImage(req, res, req.query.id));
app.get('/api/image/:id', (req, res) => serveDriveImage(req, res, req.params.id));

app.use(express.static(path.join(__dirname,'public')));

const PROFILE = {
  altura:'151 cm',
  medidas:{busto:'95 cm', cintura:'80 cm', cadera:'95 cm'},
  preferencias:{
    estilo:'Elegante, femenino y cÃƒÂ³modo',
    objetivos:['verse mÃƒÂ¡s alta','alargar visualmente las piernas','definir la cintura','equilibrar los hombros','disimular los brazos','disimular el abdomen','marcar la silueta','verse mÃƒÂ¡s estilizada'],
    mangas:['3/4','largas'],
    prendas_preferidas:['blusas','camisas','busos','suÃƒÂ©teres','pantalones','jeans','chaquetas','blazers','prendas de punto'],
    calzado_preferido:['botines','tenis'],
    colores_favoritos:['negro','vino tinto','beige'],
    colores_que_no_le_gustan:['amarillo','fucsia','colores excesivamente brillantes'],
    falda:'No es una prenda de preferencia habitual.'
  }
};

async function getItems(){ const r=await google({action:'list'}); return Array.isArray(r.items)?r.items:[]; }
async function getLooks(){ const r=await google({action:'listLooks'}); return Array.isArray(r.looks)?r.looks:[]; }

async function getProfile(){
  const r = await google({action:'getProfile'});
  return r.profile || null;
}

async function updateProfile(data){
  const r = await google({
    action:'updateProfile',
    ...data
  });
  return r.profile || null;
}
function ok(res,data,status=200){return res.status(status).json({ok:true,...data});}
function fail(res,error,status=500){return res.status(status).json({ok:false,error:error?.message||String(error)||'Error interno.'});}

app.get('/api/health', async (_req, res) => {
  try {
    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=ping`
    );

    const data = await response.json();

    if (!response.ok || data.ok !== true) {
      throw new Error(
        data.error || 'Google Apps Script no respondiÃƒÂ³ correctamente.'
      );
    }

    return ok(res, {
      service: 'mi-closet-digital-v2',
      google: true
    });
  } catch (error) {
    return fail(res, error, 503);
  }
});

app.get('/api/profile', async (_req,res)=>{
  try{
    return ok(res,{profile:await getProfile()});
  }catch(e){
    return fail(res,e);
  }
});

app.put('/api/profile', async (req,res)=>{
  try{
    return ok(res,{profile:await updateProfile(req.body || {})});
  }catch(e){
    return fail(res,e);
  }
});
app.get('/api/meta', (_req,res)=>ok(res,{categories:CATEGORIES,profile:PROFILE}));
app.get('/api/items', async (_req,res)=>{try{return ok(res,{items:await getItems()});}catch(e){return fail(res,e);}});
app.get('/api/looks', async (_req,res)=>{try{return ok(res,{looks:await getLooks()});}catch(e){return fail(res,e);}});

app.post('/api/analyze',upload.single('image'),async(req,res)=>{try{if(!req.file)return fail(res,new Error('La foto es obligatoria.'),400);return ok(res,{analysis:await ai.analyzeItem(req.file.buffer,req.file.mimetype)});}catch(e){return fail(res,e);}});

app.post('/api/items',upload.fields([{name:'frontImage',maxCount:1},{name:'backImage',maxCount:1}]),async(req,res)=>{try{
  const front=req.files?.frontImage?.[0]; const back=req.files?.backImage?.[0];
  if(!front)return fail(res,new Error('La foto de frente es obligatoria.'),400);
  const payload=validateItemPayload(req.body,true);
  const result=await google({action:'create',...payload,frontImageBase64:front.buffer.toString('base64'),frontImageMimeType:front.mimetype,backImageBase64:back?back.buffer.toString('base64'):'',backImageMimeType:back?.mimetype||''});
  return ok(res,{item:result.item},201);
}catch(e){return fail(res,e);}});

app.post('/api/items/update',upload.fields([{name:'frontImage',maxCount:1},{name:'backImage',maxCount:1}]),async(req,res)=>{try{
  const id=cleanText(req.body.id); if(!id)return fail(res,new Error('Falta el ID del artÃƒÂ­culo.'),400);
  const payload=validateItemPayload(req.body,false); const front=req.files?.frontImage?.[0]; const back=req.files?.backImage?.[0];
  const result=await google({action:'update',id,...payload,frontImageBase64:front?front.buffer.toString('base64'):'',frontImageMimeType:front?.mimetype||'',backImageBase64:back?back.buffer.toString('base64'):'',backImageMimeType:back?.mimetype||''});
  return ok(res,{item:result.item});
}catch(e){return fail(res,e);}});
app.delete('/api/items/:id',async(req,res)=>{try{const id=cleanText(req.params.id);if(!id)return fail(res,new Error('Falta el ID.'),400);const r=await google({action:'delete',id});return ok(res,{message:r.message||'ArtÃƒÂ­culo eliminado.'});}catch(e){return fail(res,e);}});

app.post('/api/asesoria',async(req,res)=>{try{
  const query=cleanText(req.body?.consulta); if(!query)return fail(res,new Error('La consulta es obligatoria.'),400);
  const closet=await getItems();
  if(!closet.length)return fail(res,new Error('El armario no tiene prendas disponibles.'),400);
  const wantsLooks=Boolean(req.body?.generateLooks);
  if(wantsLooks){
    const result=await ai.proposeLooks({query,profile:PROFILE,closet}); console.log('RESPUESTA IA LOOKS:', JSON.stringify(result.looks, null, 2));
    const looks=result.looks.map(look=>sanitizeAiLook(look,closet));
    return ok(res,{mode:'looks',looks});
  }
  return ok(res,{mode:'text',answer:await ai.advise({query,profile:PROFILE,closet})});
}catch(e){return fail(res,e);}});

app.post('/api/asesoria/visual',async(req,res)=>{try{
  const look=req.body?.look; if(!look)return fail(res,new Error('Falta el look.'),400);
  const closet=await getItems(); validateLookAgainstCloset(look,closet);
  const ids=[look.top,look.jacket,look.bottom,look.onePiece,look.shoes,look.bag,...normalizeAccessories(look.accessories)].filter(Boolean).map(String);
  const selected=closet.filter(item=>ids.includes(String(item.id)));
  if(!selected.length)return fail(res,new Error('No se encontraron las prendas del look.'),400);
  const modelBuffer=await fs.readFile(path.join(__dirname,'public','modelo-referencia.png'));
  const images=[];
  for(const item of selected){
    const url=item.frontImage||item.image||''; if(!url)continue;
    try {
      const image=await fetchDriveImage(url);
      images.push({id:String(item.id),buffer:image.buffer,mimeType:image.mimeType});
    } catch {
      continue;
    }
  }
  if(!images.length)return fail(res,new Error('No fue posible obtener las fotos de las prendas.'),400);
  const prompt=`Crea UN SOLO visual de cuerpo entero usando exactamente el modelo de referencia y ÃƒÂºnicamente las prendas de las imÃƒÂ¡genes suministradas. No inventes ni sustituyas prendas. Conserva colores, cortes, estampados, texturas, proporciones y detalles visibles. La persona debe verse completa de cabeza a pies. No collage, no paneles, no texto, no logotipos inventados. Fondo limpio y neutro.\nLOOK: ${look.name||''}\nDESCRIPCIÃƒâ€œN: ${look.description||''}\nESTILISMO: ${look.styling||''}`;
  const imageBase64=await ai.generateVisual({modelImageBuffer:modelBuffer,selectedImages:images,prompt});
  return ok(res,{imageBase64,mimeType:'image/png'});
}catch(e){return fail(res,e);}});

app.post('/api/looks',async(req,res)=>{try{
  const data=req.body||{}; const name=cleanText(data.name); if(!name)return fail(res,new Error('El nombre del look es obligatorio.'),400);
  const closet=await getItems(); const look={...data,name,accessories:normalizeAccessories(data.accessories)}; validateLookAgainstCloset(look,closet);
  if(!data.generatedImage) return fail(res,new Error('Primero debes generar el visual del look.'),400);
  const result=await google({action:'createLook',name,description:cleanText(data.description),styling:cleanText(data.styling),top:cleanText(data.top),jacket:cleanText(data.jacket),bottom:cleanText(data.bottom),onePiece:cleanText(data.onePiece),shoes:cleanText(data.shoes),bag:cleanText(data.bag),accessories:look.accessories,generatedImage:data.generatedImage,generatedImageMimeType:data.generatedImageMimeType||'image/png'});
  return ok(res,{look:result.look},201);
}catch(e){return fail(res,e);}});

app.post('/api/looks/update',async(req,res)=>{try{
  const data=req.body||{}; const id=cleanText(data.id); const name=cleanText(data.name); if(!id)return fail(res,new Error('Falta el ID del look.'),400); if(!name)return fail(res,new Error('El nombre del look es obligatorio.'),400);
  const closet=await getItems(); const look={...data,name,accessories:normalizeAccessories(data.accessories)}; validateLookAgainstCloset(look,closet);
  const result=await google({action:'updateLook',id,name,description:cleanText(data.description),styling:cleanText(data.styling),top:cleanText(data.top),jacket:cleanText(data.jacket),bottom:cleanText(data.bottom),onePiece:cleanText(data.onePiece),shoes:cleanText(data.shoes),bag:cleanText(data.bag),accessories:look.accessories,generatedImage:data.generatedImage||'',generatedImageMimeType:data.generatedImageMimeType||'image/png'});
  return ok(res,{look:result.look});
}catch(e){return fail(res,e);}});
app.delete('/api/looks/:id',async(req,res)=>{try{const id=cleanText(req.params.id);if(!id)return fail(res,new Error('Falta el ID del look.'),400);const r=await google({action:'deleteLook',id});return ok(res,{message:r.message||'Look eliminado.'});}catch(e){return fail(res,e);}});

app.use((error,_req,res,_next)=>fail(res,error,400));
app.use((_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`MI CLOSET DIGITAL V2: http://localhost:${PORT}`));







