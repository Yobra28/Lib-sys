/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const DARAJA_SANDBOX = 'https://sandbox.safaricom.co.ke';
const DARAJA_PRODUCTION = 'https://api.safaricom.co.ke';

export interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface MpesaCallbackPayload {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortCode: string;
  private readonly passkey: string;
  private readonly callbackBaseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private configService: ConfigService) {
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    this.baseUrl =
      this.configService.get<string>('MPESA_ENV') === 'production'
        ? DARAJA_PRODUCTION
        : DARAJA_SANDBOX;
    this.consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY') || '';
    this.consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET') || '';
    this.shortCode = this.configService.get<string>('MPESA_SHORTCODE') || '174379';
    this.passkey = this.configService.get<string>('MPESA_PASSKEY') || '';
    const raw =
      this.configService.get<string>('MPESA_CALLBACK_BASE_URL') ||
      this.configService.get<string>('APP_URL') ||
      'http://localhost:3000';
    this.callbackBaseUrl = (typeof raw === 'string' ? raw : '').trim().replace(/\/+$/, '');
  }

  isConfigured(): boolean {
    return !!(this.consumerKey && this.consumerSecret && this.passkey);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`M-Pesa OAuth failed: ${res.status} ${text}`);
      throw new Error('M-Pesa authentication failed');
    }
    const data = (await res.json()) as { access_token: string; expires_in: string };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (Number(data.expires_in) - 60) * 1000;
    return this.accessToken;
  }

  private formatPhone(phone: string): string {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    else if (!p.startsWith('254')) p = '254' + p;
    return p;
  }

  async initiateStkPush(
    phone: string,
    amount: number,
    accountReference: string,
    transactionDesc: string,
  ): Promise<StkPushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'M-Pesa is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY.',
      };
    }
    const formattedPhone = this.formatPhone(phone);
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      this.shortCode + this.passkey + timestamp,
      'utf8',
    ).toString('base64');

    // Safaricom requires HTTPS for CallBackURL; normalize and build full URL
    let base = this.callbackBaseUrl;
    if (base.startsWith('http://')) {
      base = 'https://' + base.slice(7);
      this.logger.warn('CallBackURL was HTTP; using HTTPS for M-Pesa request.');
    }
    const callbackUrl = `${base}/api/payments/mpesa/callback`;
    this.logger.log(`M-Pesa STK CallBackURL: ${callbackUrl}`);

    const body = {
      BusinessShortCode: this.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13),
    };

    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        errorCode?: string;
        errorMessage?: string;
      };
      if (data.CheckoutRequestID) {
        return {
          success: true,
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
        };
      }
      return {
        success: false,
        errorCode: data.errorCode || 'UNKNOWN',
        errorMessage: data.errorMessage || 'STK push failed',
      };
    } catch (err: any) {
      this.logger.error('STK push request failed', err);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err?.message || 'Failed to initiate payment',
      };
    }
  }

  parseCallbackPayload(raw: unknown): MpesaCallbackPayload {
    return (typeof raw === 'object' && raw !== null ? raw : {}) as MpesaCallbackPayload;
  }

  getCheckoutResult(payload: MpesaCallbackPayload): {
    checkoutRequestId: string | null;
    resultCode: number;
    resultDesc: string;
    receiptNumber: string | null;
  } {
    const stk = payload.Body?.stkCallback;
    if (!stk) {
      return {
        checkoutRequestId: null,
        resultCode: -1,
        resultDesc: 'Invalid callback',
        receiptNumber: null,
      };
    }
    let receiptNumber: string | null = null;
    const items = stk.CallbackMetadata?.Item;
    if (items) {
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber');
      if (receipt && typeof receipt.Value === 'string') receiptNumber = receipt.Value;
    }
    return {
      checkoutRequestId: stk.CheckoutRequestID,
      resultCode: stk.ResultCode,
      resultDesc: stk.ResultDesc,
      receiptNumber,
    };
  }
}
