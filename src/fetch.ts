import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ProxyAgent } from 'proxy-agent';

export async function fetchWithProxy(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<AxiosResponse> {
  options.httpAgent = new ProxyAgent();
  options.httpsAgent = new ProxyAgent();
  return axios(url, options);
}

export function fetchWithTimeout(
  url: string,
  options: AxiosRequestConfig = {},
  timeout: number,
): Promise<AxiosResponse> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    options.signal = controller.signal;

    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout} ms`));
    }, timeout);

    fetchWithProxy(url, options)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export async function fetchWithRetries(
  url: string,
  options: AxiosRequestConfig = {},
  timeout: number,
  retries: number = 4,
): Promise<AxiosResponse> {
  let lastError;
  const backoff = process.env.PROMPTFOO_REQUEST_BACKOFF_MS
    ? parseInt(process.env.PROMPTFOO_REQUEST_BACKOFF_MS, 10)
    : 5000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      if (process.env.PROMPTFOO_RETRY_5XX && response.status >= 500 && response.status < 600) {
        throw new Error(`Internal Server Error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      const waitTime = Math.pow(2, i) * (backoff + 1000 * Math.random());
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error(`Request failed after ${retries} retries: ${(lastError as Error).message}`);
}
