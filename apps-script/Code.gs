const ROOT_FOLDER_NAME = 'MI CLOSET DIGITAL';


const CATEGORY_FOLDERS = {

  'Busos': 'PRENDAS',
  'Camisas': 'PRENDAS',
  'Pantalones': 'PRENDAS',
  'Jeans': 'PRENDAS',
  'Vestidos': 'PRENDAS',
  'Faldas': 'PRENDAS',
  'Chaquetas': 'PRENDAS',
  'Zapatos': 'ZAPATOS',
  'Bolsos': 'BOLSOS',
  'Accesorios': 'ACCESORIOS',
  'Otros': 'PRENDAS',
  'Looks': 'LOOKS'

};


/* =========================================================
   GET
========================================================= */

function doGet(e) {

  const action =
    e && e.parameter
      ? e.parameter.action
      : '';


  if (action === 'ping') {

    return jsonResponse({

      ok: true,

      message:
        'MI CLOSET DIGITAL API funcionando'

    });

  }


  if (action === 'image') {

    return serveImage(e);

  }


  return jsonResponse({

    ok: true,

    message:
      'MI CLOSET DIGITAL API'

  });

}


/* =========================================================
   POST
========================================================= */

function doPost(e) {

  try {

    const data =
      JSON.parse(
        e.postData.contents || '{}'
      );


    switch (data.action) {


      /* =================================================
         ARTÍCULOS
      ================================================= */

      case 'create':

        return createItem(data);


      case 'list':

        return listItems();


      case 'update':

        return updateItem(data);


      case 'delete':

        return deleteItem(data);



      /* =================================================
         LOOKS
      ================================================= */

      case 'createLook':

        return createLook(data);



      case 'getProfile':

        return getProfile();


      case 'updateProfile':

        return updateProfile(data);

      case 'listLooks':

        return listLooks();


      case 'updateLook':

        return updateLook(data);


      case 'deleteLook':

        return deleteLook(data);


      default:

        return jsonResponse({

          ok: false,

          error:
            'Acción no reconocida.'

        });

    }


  } catch (error) {

    return jsonResponse({

      ok: false,

      error:
        error.message

    });

  }

}


/* =========================================================
   CREAR ARTÍCULO
========================================================= */

function createItem(data) {

  if (!data.name) {
    throw new Error(
      'El nombre es obligatorio.'
    );
  }

  if (!data.category) {
    throw new Error(
      'La categoría es obligatoria.'
    );
  }

  if (!data.color) {
    throw new Error(
      'El color es obligatorio.'
    );
  }

  if (!data.frontImageBase64) {
    throw new Error(
      'La foto de frente es obligatoria.'
    );
  }


  const sheet =
    getSheet();


  const id =
    Utilities.getUuid();


  /* =====================================================
     GUARDAR FOTO DE FRENTE
  ===================================================== */

  const frontImageInfo =
    saveImageToDrive(

      data.frontImageBase64,

      data.frontImageMimeType,

      data.name + ' - FRENTE',

      data.category

    );


  /* =====================================================
     GUARDAR FOTO DE ESPALDA
     OPCIONAL
  ===================================================== */

  let backImageInfo = {
    url: ''
  };


  if (data.backImageBase64) {

    backImageInfo =
      saveImageToDrive(

        data.backImageBase64,

        data.backImageMimeType,

        data.name + ' - ESPALDA',

        data.category

      );

  }


  /* =====================================================
     GUARDAR ARTÍCULO
     FRENTE O FRENTE + ESPALDA
  ===================================================== */

  sheet.appendRow([

    id,

    data.name,

    data.category,

    data.color,

    data.description || '',

    frontImageInfo.url,

    backImageInfo.url,

    new Date(),

    'ACTIVO'

  ]);


  /* =====================================================
     RESPUESTA
  ===================================================== */

  return jsonResponse({

    ok: true,

    item: {

      id: id,

      name: data.name,

      category: data.category,

      color: data.color,

      description:
        data.description || '',

      image:
        frontImageInfo.url,

      frontImage:
        frontImageInfo.url,

      backImage:
        backImageInfo.url,

      date:
        new Date(),

      status:
        'ACTIVO'

    }

  });

}

/* =========================================================
   ACTUALIZAR ARTÍCULO
========================================================= */

function updateItem(data) {

  if (!data.id) {

    throw new Error(
      'Falta el ID del artículo.'
    );

  }


  if (!data.name) {

    throw new Error(
      'El nombre es obligatorio.'
    );

  }


  if (!data.category) {

    throw new Error(
      'La categoría es obligatoria.'
    );

  }


  if (!data.color) {

    throw new Error(
      'El color es obligatorio.'
    );

  }


  const sheet =
    getSheet();


  const values =
    sheet
      .getDataRange()
      .getValues();


  let rowNumber = -1;

  let rowData = null;


  /* =====================================================
     BUSCAR ARTÍCULO
  ===================================================== */

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      String(values[i][0]) ===
      String(data.id)
    ) {

      rowNumber =
        i + 1;

      rowData =
        values[i];

      break;

    }

  }


  if (rowNumber === -1) {

    throw new Error(
      'No se encontró el artículo con ID: ' +
      data.id
    );

  }


  /* =====================================================
     FOTOGRAFÍAS ACTUALES
  ===================================================== */

  const oldFrontImageUrl =
    rowData[5] || '';


  const oldBackImageUrl =
    rowData[6] || '';


  let frontImageUrl =
    oldFrontImageUrl;


  let backImageUrl =
    oldBackImageUrl;


  /* =====================================================
     ACTUALIZAR FOTO DE FRENTE
  ===================================================== */

  if (data.frontImageBase64) {

    const oldFileId =
      extractDriveFileId(
        oldFrontImageUrl
      );


    if (oldFileId) {

      try {

        const oldFile =
          DriveApp.getFileById(
            oldFileId
          );

        oldFile.setTrashed(true);

      } catch (error) {

        console.log(
          'No se pudo eliminar la foto de frente anterior: ' +
          error.message
        );

      }

    }


    const frontImageInfo =
      saveImageToDrive(

        data.frontImageBase64,

        data.frontImageMimeType,

        data.name + ' - FRENTE',

        data.category

      );


    frontImageUrl =
      frontImageInfo.url;

  }


  /* =====================================================
     COMPATIBILIDAD CON LA EDICIÓN ACTUAL
     Si llega imageBase64, se considera foto de frente.
  ===================================================== */

  else if (data.imageBase64) {

    const oldFileId =
      extractDriveFileId(
        oldFrontImageUrl
      );


    if (oldFileId) {

      try {

        const oldFile =
          DriveApp.getFileById(
            oldFileId
          );

        oldFile.setTrashed(true);

      } catch (error) {

        console.log(
          'No se pudo eliminar la foto anterior: ' +
          error.message
        );

      }

    }


    const frontImageInfo =
      saveImageToDrive(

        data.imageBase64,

        data.imageMimeType,

        data.name + ' - FRENTE',

        data.category

      );


    frontImageUrl =
      frontImageInfo.url;

  }


  /* =====================================================
     ACTUALIZAR FOTO DE ESPALDA
  ===================================================== */

  if (data.backImageBase64) {

    const oldFileId =
      extractDriveFileId(
        oldBackImageUrl
      );


    if (oldFileId) {

      try {

        const oldFile =
          DriveApp.getFileById(
            oldFileId
          );

        oldFile.setTrashed(true);

      } catch (error) {

        console.log(
          'No se pudo eliminar la foto de espalda anterior: ' +
          error.message
        );

      }

    }


    const backImageInfo =
      saveImageToDrive(

        data.backImageBase64,

        data.backImageMimeType,

        data.name + ' - ESPALDA',

        data.category

      );


    backImageUrl =
      backImageInfo.url;

  }


  /* =====================================================
     ACTUALIZAR DATOS
  ===================================================== */

  sheet
    .getRange(
      rowNumber,
      2
    )
    .setValue(
      data.name
    );


  sheet
    .getRange(
      rowNumber,
      3
    )
    .setValue(
      data.category
    );


  sheet
    .getRange(
      rowNumber,
      4
    )
    .setValue(
      data.color
    );


  sheet
    .getRange(
      rowNumber,
      5
    )
    .setValue(
      data.description || ''
    );


  sheet
    .getRange(
      rowNumber,
      6
    )
    .setValue(
      frontImageUrl
    );


  sheet
    .getRange(
      rowNumber,
      7
    )
    .setValue(
      backImageUrl
    );


  sheet
    .getRange(
      rowNumber,
      8
    )
    .setValue(
      new Date()
    );


  sheet
    .getRange(
      rowNumber,
      9
    )
    .setValue(
      'ACTIVO'
    );


  /* =====================================================
     RESPUESTA
  ===================================================== */

  return jsonResponse({

    ok: true,

    item: {

      id:
        data.id,

      name:
        data.name,

      category:
        data.category,

      color:
        data.color,

      description:
        data.description || '',

      image:
        frontImageUrl,

      frontImage:
        frontImageUrl,

      backImage:
        backImageUrl,

      date:
        new Date(),

      status:
        'ACTIVO'

    }

  });

}

/* =========================================================
   LISTAR ARTÍCULOS
========================================================= */

function listItems() {

  const sheet =
    getSheet();


  const values =
    sheet
      .getDataRange()
      .getValues();


  if (values.length <= 1) {

    return jsonResponse({

      ok: true,

      items: []

    });

  }


  const items = [];


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row =
      values[i];


    if (!row[0]) {
      continue;
    }


    items.push({

      id:
        String(row[0]),

      name:
        String(row[1] || ''),

      category:
        String(row[2] || ''),

      color:
        String(row[3] || ''),

      description:
        String(row[4] || ''),

      image:
        String(row[5] || ''),

      frontImage:
        String(row[5] || ''),

      backImage:
        String(row[6] || ''),

      date:
        row[7] || '',

      status:
        String(
          row[8] ||
          'ACTIVO'
        )

    });

  }


  return jsonResponse({

    ok: true,

    items:
      items

  });

}


/* =========================================================
   ELIMINAR ARTÍCULO
========================================================= */

function deleteItem(data) {

  if (!data.id) {

    throw new Error(
      'Falta el ID del artículo.'
    );

  }


  const sheet =
    getSheet();


  const values =
    sheet
      .getDataRange()
      .getValues();


  let rowNumber = -1;

  let frontImageUrl = '';

  let backImageUrl = '';


  /* =====================================================
     BUSCAR ARTÍCULO
  ===================================================== */

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      String(values[i][0]) ===
      String(data.id)
    ) {

      rowNumber =
        i + 1;

      frontImageUrl =
        String(values[i][5] || '');

      backImageUrl =
        String(values[i][6] || '');

      break;

    }

  }


  if (rowNumber === -1) {

    throw new Error(
      'No se encontró el artículo.'
    );

  }


  /* =====================================================
     ELIMINAR FOTO DE FRENTE
  ===================================================== */

  const frontFileId =
    extractDriveFileId(
      frontImageUrl
    );


  if (frontFileId) {

    try {

      const frontFile =
        DriveApp.getFileById(
          frontFileId
        );

      frontFile.setTrashed(true);

    } catch (error) {

      console.log(
        'No se pudo eliminar la foto de frente: ' +
        error.message
      );

    }

  }


  /* =====================================================
     ELIMINAR FOTO DE ESPALDA
  ===================================================== */

  const backFileId =
    extractDriveFileId(
      backImageUrl
    );


  if (backFileId) {

    try {

      const backFile =
        DriveApp.getFileById(
          backFileId
        );

      backFile.setTrashed(true);

    } catch (error) {

      console.log(
        'No se pudo eliminar la foto de espalda: ' +
        error.message
      );

    }

  }


  /* =====================================================
     ELIMINAR FILA
  ===================================================== */

  sheet.deleteRow(
    rowNumber
  );


  /* =====================================================
     RESPUESTA
  ===================================================== */

  return jsonResponse({

    ok: true,

    message:
      'Artículo eliminado correctamente.'

  });

}


/* =========================================================
   =========================================================
   LOOKS
   =========================================================
========================================================= */


/* =========================================================
   CREAR LOOK
========================================================= */

function createLook(data) {

  if (!data.name) throw new Error('El nombre del look es obligatorio.');

  const sheet = getLooksSheet();
  const id = Utilities.getUuid();
  const accessories = normalizeAccessories(data.accessories);
  let visualUrl = '';

  if (data.generatedImage) {
    const visualInfo = saveImageToDrive(
      data.generatedImage,
      data.generatedImageMimeType || 'image/png',
      data.name + ' - VISUAL',
      'Looks'
    );
    visualUrl = visualInfo.url;
  }

  const now = new Date();
  sheet.appendRow([
    id, data.name, data.top || '', data.bottom || '', data.onePiece || '',
    data.shoes || '', data.bag || '', accessories, now, 'ACTIVO', visualUrl,
    data.jacket || '', data.description || '', data.styling || ''
  ]);

  return jsonResponse({
    ok: true,
    look: {
      id, name:data.name, top:data.top || '', jacket:data.jacket || '', bottom:data.bottom || '',
      onePiece:data.onePiece || '', shoes:data.shoes || '', bag:data.bag || '',
      accessories:parseAccessories(accessories), date:now, status:'ACTIVO', visual:visualUrl,
      description:data.description || '', styling:data.styling || ''
    }
  });
}


/* =========================================================
   LISTAR LOOKS
========================================================= */

function listLooks() {
  const sheet = getLooksSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return jsonResponse({ok:true, looks:[]});
  const looks=[];
  for (let i=1;i<values.length;i++) {
    const row=values[i];
    if (!row[0]) continue;
    looks.push({
      id:String(row[0]), name:String(row[1] || ''), top:String(row[2] || ''), bottom:String(row[3] || ''),
      onePiece:String(row[4] || ''), shoes:String(row[5] || ''), bag:String(row[6] || ''),
      accessories:parseAccessories(row[7]), date:row[8] || '', status:String(row[9] || 'ACTIVO'),
      visual:String(row[10] || ''), jacket:String(row[11] || ''), description:String(row[12] || ''), styling:String(row[13] || '')
    });
  }
  return jsonResponse({ok:true, looks});
}


/* =========================================================
   ACTUALIZAR LOOK
========================================================= */

function updateLook(data) {
  if (!data.id) throw new Error('Falta el ID del look.');
  if (!data.name) throw new Error('El nombre del look es obligatorio.');
  const sheet=getLooksSheet();
  const values=sheet.getDataRange().getValues();
  let rowNumber=-1;
  let oldVisual='';
  for(let i=1;i<values.length;i++){
    if(String(values[i][0])===String(data.id)){ rowNumber=i+1; oldVisual=String(values[i][10]||''); break; }
  }
  if(rowNumber===-1) throw new Error('No se encontró el look.');
  const accessories=normalizeAccessories(data.accessories);
  let visualUrl=oldVisual;
  if(data.generatedImage){
    const visualInfo=saveImageToDrive(data.generatedImage,data.generatedImageMimeType||'image/png',data.name+' - VISUAL','Looks');
    visualUrl=visualInfo.url;
  }
  sheet.getRange(rowNumber,2,1,13).setValues([[
    data.name, data.top||'', data.bottom||'', data.onePiece||'', data.shoes||'', data.bag||'', accessories,
    new Date(), 'ACTIVO', visualUrl, data.jacket||'', data.description||'', data.styling||''
  ]]);
  return jsonResponse({ok:true,look:{
    id:data.id,name:data.name,top:data.top||'',jacket:data.jacket||'',bottom:data.bottom||'',onePiece:data.onePiece||'',
    shoes:data.shoes||'',bag:data.bag||'',accessories:parseAccessories(accessories),date:new Date(),status:'ACTIVO',visual:visualUrl,
    description:data.description||'',styling:data.styling||''
  }});
}


/* =========================================================
   ELIMINAR LOOK
========================================================= */

function deleteLook(data) {

  if (!data.id) {

    throw new Error(
      'Falta el ID del look.'
    );

  }


  const sheet =
    getLooksSheet();


  const values =
    sheet
      .getDataRange()
      .getValues();


  let rowNumber = -1;


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (

      String(values[i][0]) ===
      String(data.id)

    ) {

      rowNumber =
        i + 1;

      break;

    }

  }


  if (rowNumber === -1) {

    throw new Error(
      'No se encontró el look.'
    );

  }


  sheet.deleteRow(
    rowNumber
  );


  return jsonResponse({

    ok: true,

    message:
      'Look eliminado correctamente.'

  });

}


/* =========================================================
   NORMALIZAR ACCESORIOS
========================================================= */

function normalizeAccessories(
  accessories
) {

  if (
    accessories ===
    undefined ||
    accessories ===
    null ||
    accessories === ''
  ) {

    return '[]';

  }


  if (
    Array.isArray(
      accessories
    )
  ) {

    return JSON.stringify(
      accessories
    );

  }


  if (
    typeof accessories ===
    'string'
  ) {

    const text =
      accessories.trim();


    if (!text) {

      return '[]';

    }


    try {

      const parsed =
        JSON.parse(text);


      if (
        Array.isArray(parsed)
      ) {

        return JSON.stringify(
          parsed
        );

      }

    } catch (error) {

      /* No es JSON.
         Se intenta como lista
         separada por comas. */

    }


    return JSON.stringify(

      text
        .split(',')
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean)

    );

  }


  return '[]';

}


/* =========================================================
   LEER ACCESORIOS
========================================================= */

function parseAccessories(
  value
) {

  if (
    !value
  ) {

    return [];

  }


  if (
    Array.isArray(value)
  ) {

    return value;

  }


  try {

    const parsed =
      JSON.parse(
        String(value)
      );


    if (
      Array.isArray(parsed)
    ) {

      return parsed;

    }


  } catch (error) {

    /* Ignorar */

  }


  return [];

}


/* =========================================================
   GUARDAR IMAGEN EN GOOGLE DRIVE
========================================================= */

function saveImageToDrive(

  base64,

  mimeType,

  name,

  category

) {


  const folder =
    getCategoryFolder(
      category
    );


  const extension =
    getExtension(
      mimeType
    );


  const safeName =
    sanitizeFileName(
      name ||
      'articulo'
    );


  const fileName =

    safeName +
    '_' +
    Utilities.getUuid() +
    extension;


  const bytes =
    Utilities.base64Decode(
      base64
    );


  const blob =
    Utilities.newBlob(

      bytes,

      mimeType,

      fileName

    );


  const file =
    folder.createFile(
      blob
    );


  /*
    Intentar hacer la imagen visible
    para la aplicación pública.
  */

  try {

    file.setSharing(

      DriveApp.Access
        .ANYONE_WITH_LINK,

      DriveApp.Permission
        .VIEW

    );

  } catch (error) {

    console.log(

      'No fue posible cambiar permisos: ' +
      error.message

    );

  }


  return {

    id:
      file.getId(),

    url:

      'https://drive.google.com/uc?id=' +
      file.getId(),

    name:
      file.getName()

  };

}


/* =========================================================
   OBTENER CARPETA SEGÚN CATEGORÍA
========================================================= */

function getCategoryFolder(
  category
) {

  const rootFolder =
    getRootFolder();


  const folderName =
    CATEGORY_FOLDERS[category] ||
    'PRENDAS';


  const folders =
    rootFolder
      .getFoldersByName(
        folderName
      );


  if (
    folders.hasNext()
  ) {

    return folders.next();

  }


  return rootFolder
    .createFolder(
      folderName
    );

}


/* =========================================================
   OBTENER CARPETA PRINCIPAL
========================================================= */

function getRootFolder() {

  const folders =
    DriveApp
      .getFoldersByName(
        ROOT_FOLDER_NAME
      );


  if (
    folders.hasNext()
  ) {

    return folders.next();

  }


  return DriveApp
    .createFolder(
      ROOT_FOLDER_NAME
    );

}


/* =========================================================
   OBTENER HOJA DE ARTÍCULOS
========================================================= */


function getProfileSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('No se encontro la hoja de calculo.');

  let sheet = spreadsheet.getSheetByName('PERFIL');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('PERFIL');
  }

  const headers = [
    'ALTURA',
    'BUSTO',
    'CINTURA',
    'CADERA',
    'ESTILOS',
    'COLORES_FAVORECEN',
    'COLORES_NO_USAR'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getProfile() {
  const sheet = getProfileSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return jsonResponse({
      ok: true,
      profile: null
    });
  }

  const row = values[1];

  return jsonResponse({
    ok: true,
    profile: {
      altura: String(row[0] || ''),
      medidas: {
        busto: String(row[1] || ''),
        cintura: String(row[2] || ''),
        cadera: String(row[3] || '')
      },
      preferencias: {
        estilos: String(row[4] || ''),
        colores_favorecen: String(row[5] || ''),
        colores_no_usar: String(row[6] || '')
      }
    }
  });
}

function updateProfile(data) {
  const sheet = getProfileSheet();

  const row = [
    data.altura || '',
    data.busto || '',
    data.cintura || '',
    data.cadera || '',
    data.estilos || '',
    data.colores_favorecen || '',
    data.colores_no_usar || ''
  ];

  sheet.getRange(2, 1, 1, row.length).setValues([row]);

  return getProfile();
}
function getSheet() {

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();


  if (!spreadsheet) {

    throw new Error(
      'No se encontró la hoja de cálculo.'
    );

  }


  /*
    La hoja actual de artículos
    sigue siendo la primera pestaña.
  */

  const sheet =
    spreadsheet
      .getSheets()[0];


  return sheet;

}


/* =========================================================
   OBTENER HOJA DE LOOKS
========================================================= */

function getLooksSheet() {
  const spreadsheet=SpreadsheetApp.getActiveSpreadsheet();
  if(!spreadsheet) throw new Error('No se encontró la hoja de cálculo.');
  let sheet=spreadsheet.getSheetByName('LOOKS');
  if(!sheet) sheet=spreadsheet.insertSheet('LOOKS');
  const headers=['ID','NOMBRE','SUPERIOR','INFERIOR','VESTIDO','ZAPATOS','BOLSO','ACCESORIOS','FECHA','ESTADO','VISUAL','CHAQUETA','DESCRIPCIÓN','ESTILISMO'];
  if(sheet.getLastRow()===0){ sheet.getRange(1,1,1,headers.length).setValues([headers]); }
  else {
    const current=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),headers.length)).getValues()[0];
    headers.forEach((header,index)=>{ if(String(current[index]||'').trim()!==header) sheet.getRange(1,index+1).setValue(header); });
  }
  return sheet;
}


/* =========================================================
   OBTENER EXTENSIÓN
========================================================= */

function getExtension(
  mimeType
) {

  switch (
    mimeType
  ) {

    case 'image/jpeg':

      return '.jpg';


    case 'image/png':

      return '.png';


    case 'image/webp':

      return '.webp';


    default:

      return '.jpg';

  }

}


/* =========================================================
   LIMPIAR NOMBRE DE ARCHIVO
========================================================= */

function sanitizeFileName(
  name
) {

  return String(name)

    .replace(
      /[\\\/:*?"<>|]/g,
      ''
    )

    .replace(
      /\s+/g,
      '_'
    )

    .substring(
      0,
      80
    );

}


/* =========================================================
   EXTRAER ID DE GOOGLE DRIVE
========================================================= */

function extractDriveFileId(
  url
) {

  if (!url) {

    return '';

  }


  const text =
    String(url);


  /*
    Formato:
    ?id=XXXXXXXX
  */

  let match =
    text.match(
      /[?&]id=([^&]+)/
    );


  if (match) {

    return match[1];

  }


  /*
    Formato:
    /d/XXXXXXXX/
  */

  match =
    text.match(
      /\/d\/([^\/]+)/
    );


  if (match) {

    return match[1];

  }


  /*
    Formato:
    /file/d/XXXXXXXX/
  */

  match =
    text.match(
      /\/file\/d\/([^\/]+)/
    );


  if (match) {

    return match[1];

  }


  return '';

}


/* =========================================================
   SERVIR IMAGEN
========================================================= */

function serveImage(e) {

  const id =
    e && e.parameter
      ? e.parameter.id
      : '';


  if (!id) {

    return jsonResponse({

      ok: false,

      error:
        'Falta el ID de la imagen.'

    });

  }


  try {

    const file =
      DriveApp
        .getFileById(id);


    const blob =
      file.getBlob();


    const base64 =
      Utilities.base64Encode(
        blob.getBytes()
      );


    return ContentService

      .createTextOutput(
        base64
      )

      .setMimeType(
        ContentService
          .MimeType
          .TEXT
      );


  } catch (error) {

    return jsonResponse({

      ok: false,

      error:
        error.message

    });

  }

}


/* =========================================================
   RESPUESTA JSON
========================================================= */

function jsonResponse(
  data
) {

  return ContentService

    .createTextOutput(

      JSON.stringify(
        data
      )

    )

    .setMimeType(

      ContentService
        .MimeType
        .JSON

    );

}


function pruebaLista() {
  const sheet = getSheet();

  const values = sheet
    .getDataRange()
    .getValues();

  Logger.log('HOJA: ' + sheet.getName());
  Logger.log('FILAS: ' + values.length);
  Logger.log(JSON.stringify(values.slice(0, 3)));
}
