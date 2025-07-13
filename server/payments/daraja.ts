import axios from 'axios';

interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortCode: string;
  environment: 'sandbox' | 'production';
}

interface MPesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

interface MPesaPaymentResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class DarajaService {
  private config: DarajaConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      consumerKey: process.env.DARAJA_CONSUMER_KEY || '',
      consumerSecret: process.env.DARAJA_CONSUMER_SECRET || '',
      passkey: process.env.DARAJA_PASSKEY || '',
      shortCode: process.env.DARAJA_SHORT_CODE || '',
      environment: (process.env.DARAJA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
    
    this.baseUrl = this.config.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate with Daraja API');
    }
  }

  private generateTimestamp(): string {
    const now = new Date();
    return now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
  }

  private generatePassword(): string {
    const timestamp = this.generateTimestamp();
    const password = Buffer.from(this.config.shortCode + this.config.passkey + timestamp).toString('base64');
    return password;
  }

  async initiatePayment(paymentRequest: MPesaPaymentRequest): Promise<MPesaPaymentResponse> {
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword();

    // Format phone number to international format
    let phoneNumber = paymentRequest.phoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.slice(1);
    }

    const requestBody = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: paymentRequest.amount,
      PartyA: phoneNumber,
      PartyB: this.config.shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: paymentRequest.callbackUrl,
      AccountReference: paymentRequest.accountReference,
      TransactionDesc: paymentRequest.transactionDesc,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to initiate M-Pesa payment:', error);
      throw new Error('Failed to initiate payment');
    }
  }

  async checkPaymentStatus(checkoutRequestId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword();

    const requestBody = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw new Error('Failed to check payment status');
    }
  }

  processCallback(callbackData: any): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    phoneNumber?: string;
    errorMessage?: string;
  } {
    try {
      const { Body } = callbackData;
      
      if (Body.stkCallback.ResultCode === 0) {
        // Payment successful
        const callbackMetadata = Body.stkCallback.CallbackMetadata;
        const items = callbackMetadata.Item;
        
        const transactionId = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        const amount = items.find((item: any) => item.Name === 'Amount')?.Value;
        const phoneNumber = items.find((item: any) => item.Name === 'PhoneNumber')?.Value;
        
        return {
          success: true,
          transactionId,
          amount,
          phoneNumber
        };
      } else {
        // Payment failed
        return {
          success: false,
          errorMessage: Body.stkCallback.ResultDesc
        };
      }
    } catch (error) {
      console.error('Failed to process callback:', error);
      return {
        success: false,
        errorMessage: 'Failed to process payment callback'
      };
    }
  }
}

export const darajaService = new DarajaService();