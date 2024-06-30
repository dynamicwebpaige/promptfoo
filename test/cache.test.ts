import axios from 'axios';
import { fetchWithCache, disableCache, enableCache, clearCache } from '../src/cache';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

const mockedAxiosResponse = (ok: boolean, response: object) => {
  return {
    status: ok ? 200 : 500,
    data: response,
    headers: {
      'content-type': 'application/json',
    },
  };
};

describe('fetchWithCache', () => {
  afterEach(() => {
    mockedAxios.mockReset();
  });

  it('should not cache data with failed request', async () => {
    enableCache();

    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(false, response));

    const result = await fetchWithCache(url, {}, 1000);

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cached: false, data: response });
  });

  it('should fetch data with cache enabled', async () => {
    enableCache();

    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(true, response));

    const result = await fetchWithCache(url, {}, 1000);

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cached: false, data: response });
  });

  it('should fetch data with cache enabled after previous test', async () => {
    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(true, response));

    const result = await fetchWithCache(url, {}, 1000);

    expect(mockedAxios).toHaveBeenCalledTimes(0);
    expect(result).toEqual({ cached: true, data: response });
  });

  it('should only fetch data once with cache enabled', async () => {
    enableCache();
    clearCache();

    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(true, response));
    mockedAxios.mockRejectedValue(new Error('Should not be called'));

    const [a, b] = await Promise.all([
      fetchWithCache(url, {}, 1000),
      fetchWithCache(url, {}, 1000),
    ]);

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ cached: false, data: response });
    expect(b).toEqual({ cached: true, data: response });
  });

  it('should fetch data without cache for a single test', async () => {
    disableCache();

    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(true, response));

    const result = await fetchWithCache(url, {}, 1000);

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cached: false, data: response });

    enableCache();
  });

  it('should still fetch data without cache for a single test', async () => {
    disableCache();

    const url = 'https://api.example.com/data';
    const response = { data: 'test data' };

    mockedAxios.mockResolvedValueOnce(mockedAxiosResponse(true, response));

    const result = await fetchWithCache(url, {}, 1000);

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cached: false, data: response });

    enableCache();
  });
});
