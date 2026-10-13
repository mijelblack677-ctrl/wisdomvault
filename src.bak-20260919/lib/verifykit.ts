import { client } from './db/connection';

async function getConfig() {
  const urlResult = await client`SELECT config_value FROM platform_config WHERE config_key = 'verifykit_api_url'`;
  const keyResult = await client`SELECT config_value FROM platform_config WHERE config_key = 'verifykit_api_key'`;
  
  return {
    apiUrl: urlResult[0]?.config_value || 'http://66.29.152.43:5000',
    apiKey: keyResult[0]?.config_value || '',
  };
}

export async function registerMerchant(name: string, email: string, phone: string) {
  const config = await getConfig();
  
  try {
    const response = await fetch(`${config.apiUrl}/v1/merchants/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({ name, email, phone }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('VerifyKit registration error:', error);
    throw error;
  }
}

export async function expectPayment(
  merchantId: string,
  amount: number,
  reference: string,
  phoneNumber: string
) {
  const config = await getConfig();
  
  try {
    const response = await fetch(`${config.apiUrl}/v1/payments/expect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        merchantId,
        amount,
        reference,
        phoneNumber,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('VerifyKit expectPayment error:', error);
    throw error;
  }
}

export async function checkPaymentStatus(reference: string) {
  const config = await getConfig();
  
  try {
    const response = await fetch(`${config.apiUrl}/v1/payments/status/${reference}`, {
      headers: {
        'X-API-Key': config.apiKey,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('VerifyKit checkPaymentStatus error:', error);
    throw error;
  }
}

export async function verifyBySMS(
  merchantId: string,
  phoneNumber: string,
  code: string
) {
  const config = await getConfig();
  
  try {
    const response = await fetch(`${config.apiUrl}/v1/verify/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        merchantId,
        phoneNumber,
        code,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('VerifyKit verifyBySMS error:', error);
    throw error;
  }
}

export async function getRecentTransactions(limit: number = 20) {
  const config = await getConfig();
  
  try {
    const response = await fetch(`${config.apiUrl}/v1/transactions/recent?limit=${limit}`, {
      headers: {
        'X-API-Key': config.apiKey,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('VerifyKit getRecentTransactions error:', error);
    throw error;
  }
}
