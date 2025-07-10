// Zde by byl vyplněn přístup pro API daného eshopu a přístupový token.
const SHOPIFY_API_BASE_URL = 'https://nazev-demo-obchodu.myshopify.com/admin/api/2024-10/orders.json';
const SHOPIFY_ACCESS_TOKEN = 'shpat_ZDE_BYL_SKUTECNY_TOKEN_PRO_PORTFOLIO_SMAZAN';

/**
 * Získá nejnovější objednávky z definované POS lokace.
 */
function getLatestUnpaidPOSOrder() {
  const TARGET_LOCATION_ID = "ID_POBOCKY_ZDE"; 

  const url = `${SHOPIFY_API_BASE_URL}?status=any&source_name=pos&location_id=${TARGET_LOCATION_ID}&limit=1&order=created_at DESC`;

  const options = {
    method: 'get',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true // Důležité pro odchycení chyb API
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseParsed = JSON.parse(response.getContentText());
    
    
    if (responseParsed && responseParsed.orders && responseParsed.orders.length > 0) {
    
      const unpaidOrders = responseParsed.orders.filter(order => order.financial_status === 'paid');

      if (unpaidOrders.length > 0) {
        const latestUnpaidOrder = unpaidOrders[0];
        Logger.log("Nalezena relevantní objednávka.");
        return latestUnpaidOrder;
      } else {
        Logger.log("Nebyly nalezeny žádné relevantní POS objednávky.");
        return null;
      }
    } else {
      Logger.log("Nebyly nalezeny žádné POS objednávky z dané lokace, nebo došlo k chybě API.");
      return null;
    }
  } catch (e) {
    Logger.log("Chyba při volání Shopify REST API: " + e.message);
    return null;
  }
}


/**
 * Generuje QR kód pro platbu pomocí veřejného API.
 * @param {object} orderData Objekt s daty objednávky.
 * @return {Blob} Obrázek QR kódu ve formátu Blob.
 */
function generateQRblob(orderData) {
  // všechny údaje jsou fiktivní
  const PAYLIBO_API_BASE_URL = 'https://api.paylibo.com/paylibo/';
  const ACCOUNT_IBAN = 'CZ12345678901234567890';
  const COMPANY_NAME = 'Moje Portfolio s.r.o.';
  const ACCOUNT_NUMBER = '123456789';
  const BANK_CODE = '0000';

  if (!orderData) {
    Logger.log("generateQRblob: Chybí data objednávky.");
    return null;
  }

  const amount = orderData.total_price; 
  const vs = orderData.name ? String(orderData.name).replace('#', '') : '';
  const message = `Platba za obj. ${orderData.name}`;
  
  // Sestavení URL pro Paylibo API
  const qrUrl = `${PAYLIBO_API_BASE_URL}generator/image?` +
                `accountNumber=${ACCOUNT_NUMBER}&` +
                `bankCode=${BANK_CODE}&` +
                `amount=${amount}&` +
                `currency=CZK&` +
                `vs=${vs}&` +
                `recipientName=${encodeURIComponent(COMPANY_NAME)}&` +
                `message=${encodeURIComponent(message)}`;
  
  try {
    const response = UrlFetchApp.fetch(qrUrl, { method: 'get' });
    if (response.getResponseCode() === 200) {
      Logger.log("QR kód úspěšně vygenerován.");
      return response.getBlob().setContentType('image/png');
    } else {
      Logger.log("Chyba při generování QR kódu. Status: " + response.getResponseCode());
      return null;
    }
  } catch (e) {
    Logger.log("Chyba při volání Paylibo QR API: " + e.message);
    return null;
  }
}

/**
 * Hlavní funkce, která orchestruje proces získání dat, generování QR
 * a vložení výsledku do aktivního listu Google Sheets.
 */
function insertQRintoSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Vymaže předchozí obsah pro čistý výsledek
  sheet.getImages().forEach(image => image.remove());
  sheet.getRange("B1:B4").clearContent();

  // 1. Získání dat objednávky
  const orderData = getLatestUnpaidPOSOrder();
  if (!orderData) {
    sheet.getRange("B1").setValue("Nenalezena žádná nová objednávka k zobrazení.");
    return;
  }

  // 2. Generování QR kódu
  const qrBlob = generateQRblob(orderData);
  if (!qrBlob) {
    sheet.getRange("B1").setValue("Chyba při generování QR kódu.");
    return;
  }

  // 3. Vložení QR kódu a detailů do listu
  sheet.insertImage(qrBlob, 1, 1); // Vloží do buňky A1
  sheet.getRange("B1").setValue(`Objednávka: ${orderData.name}`);
  sheet.getRange("B2").setValue(`Vytvořeno: ${new Date(orderData.created_at).toLocaleString('cs-CZ')}`);
  sheet.getRange("B3").setValue(`Částka: ${orderData.total_price} CZK`);
  sheet.getRange("B4").setValue(`Zdroj: ${orderData.source_name}`);

  Logger.log("Proces dokončen. QR kód a detaily vloženy do listu.");
}