import { XMLParser, XMLValidator } from 'fast-xml-parser';

const NS = 'http://ws.comax.co.il/Comax_WebServices/';

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function element(name, value) {
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function stringArray(name, values) {
  return `<${name}>${values.map(v => element('string', v)).join('')}</${name}>`;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

export async function createComaxOrder(order) {
  const items = order.items;
  const itemIds = items.map(i => i.sku);
  const quantities = items.map(i => String(i.quantity));
  const prices = items.map(i => Number(i.price).toFixed(2));
  const discounts = items.map(i => Number(i.discountPercent ?? 0).toString());
  const totals = items.map((i, index) =>
    (Number(i.totalSum ?? (Number(i.quantity) * Number(i.price) * (1 - Number(i.discountPercent ?? 0) / 100)))).toFixed(2)
  );
  const itemRemarks = items.map(i => i.remarks ?? '');
  const blankItems = items.map(() => '');

  // Keep all fields in the operation's documented order. Optional values default to empty strings.
  const fields = [
    ['CustomerID', order.customerId],
    ['StoreID', order.storeId ?? requiredEnv('COMAX_STORE_ID')],
    ['PriceListID', order.priceListId ?? requiredEnv('COMAX_PRICE_LIST_ID')],
    ['DoJ5', order.doJ5 ?? ''],
    ['Remarks', order.remarks ?? ''],
    ['Details', order.details ?? ''],
    ['Reference', order.reference],
    ['Mode', order.mode ?? process.env.COMAX_MODE ?? 'Add'],
    ['DocNumber', order.docNumber ?? ''],
    ['ManualDocNumber', order.manualDocNumber ?? ''],
  ].map(([k, v]) => element(k, v)).join('');

  const arrays = [
    stringArray('Items', itemIds),
    stringArray('Quantity', quantities),
    stringArray('Price', prices),
    stringArray('DiscountPercent', discounts),
    stringArray('TotalSum', totals),
    stringArray('ItemRemarks', itemRemarks),
    stringArray('PromoID', blankItems),
    stringArray('PromoRank', blankItems),
  ].join('');

  const c = order.customer ?? {};
  const d = order.delivery ?? {};
  const tailFields = [
    ['ClubCustomer', order.clubCustomer ?? ''],
    ['CustomerName', c.name],
    ['CustomerAddress', c.address],
    ['CustomerCity', c.city],
    ['CustomerPhone', c.phone],
    ['CustomerZip', c.zip],
    ['Status', order.status],
    ['AgentID', order.agentId],
    ['DeliveryDate', d.date],
    ['DeliveryHourFrom', d.hourFrom],
    ['DeliveryHourTo', d.hourTo],
    ['DeliveryAddress', d.address],
    ['DeliveryAddressNumber', d.addressNumber],
    ['DeliveryCity', d.city],
    ['DeliveryZip', d.zip],
    ['DeliveryContactMan', d.contactName],
    ['DeliveryRemark', d.remarks],
    ['DeliveryFloor', d.floor],
    ['DeliveryFlat', d.flat],
    ['DeliveryTelephone', d.phone],
    ['DeliveryTelephone2', d.phone2],
    ['DeliveryEmail', d.email],
    ['DeliveryType', d.type],
    ['PayType', order.payType],
    ['CreditPaysNumber', order.creditPaysNumber],
    ['CreditCompany', order.creditCompany],
    ['CreditTransactionType', order.creditTransactionType],
    ['CreditExpireDate', ''],
    ['CreditCardNumber', ''],
    ['CreditTokenNumber', order.creditTokenNumber],
    ['CreditCVV', ''],
    ['CreditTZ', ''],
    ['Bank', ''],
    ['BankBranch', ''],
    ['BankAccount', ''],
    ['CheckNumber', ''],
    ['CheckDate', ''],
    ['PriceFromPriceList', order.priceFromPriceList ?? ''],
    ['LoginID', requiredEnv('COMAX_LOGIN_ID')],
    ['LoginPassword', requiredEnv('COMAX_LOGIN_PASSWORD')],
  ].map(([k, v]) => element(k, v)).join('');

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WriteCustomersOrderByParamsExtendedPlusPrice xmlns="${NS}">${fields}${arrays}${tailFields}</WriteCustomersOrderByParamsExtendedPlusPrice>
  </soap:Body>
</soap:Envelope>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.COMAX_TIMEOUT_MS ?? 20000));
  let response;
  let body;
  try {
    response = await fetch(requiredEnv('COMAX_ENDPOINT'), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${process.env.COMAX_SOAP_ACTION ?? NS + 'WriteCustomersOrderByParamsExtendedPlusPrice'}"`,
      },
      body: soap,
      signal: controller.signal,
    });
    body = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Comax HTTP error ${response.status}`);
  }
  const validation = XMLValidator.validate(body);
  if (validation !== true) throw new Error('Comax returned invalid XML');

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: true,
    isArray: (name) => name === 'ClsErrors',
  });
  const parsed = parser.parse(body);
  const envelope = parsed?.Envelope;
  const soapBody = envelope?.Body;
  if (soapBody?.Fault) {
    const fault = soapBody.Fault;
    throw new Error(`Comax SOAP fault: ${fault.faultstring ?? 'Unknown SOAP fault'}`);
  }

  const result = soapBody?.WriteCustomersOrderByParamsExtendedPlusPriceResponse
    ?.WriteCustomersOrderByParamsExtendedPlusPriceResult;
  if (!result) throw new Error('Comax response did not contain the expected order result');

  const rawErrors = result.Err?.ClsErrors ?? [];
  const errors = (Array.isArray(rawErrors) ? rawErrors : [rawErrors])
    .filter(e => e && e.ErrorType && e.ErrorType !== 'Unknown')
    .map(e => ({
      type: e.ErrorType,
      itemId: e.ItemID ?? null,
      orderNumber: e.OrderNumber ?? null,
      price: e.Price ?? null,
      quantity: e.Quantity ?? null,
      message: e.ErrorType,
    }));

  return {
    success: errors.length === 0,
    customerId: result.CustomerID ?? null,
    documentNumber: result.DocNumber ?? null,
    reference: result.Reference ?? order.reference ?? null,
    totalSum: result.TotalSum ?? null,
    totalQuantity: result.TotalQuantity ?? null,
    linesCount: result.LinesCount ?? null,
    mode: result.Mode ?? null,
    status: result.Status ?? null,
    errors,
  };
}
