import axios from 'axios';
import invariant from 'tiny-invariant';

interface PortkeyResponse {
  success: boolean;
  data: {
    model: string;
    n: number;
    top_p: number;
    max_tokens: number;
    temperature: number;
    presence_penalty: number;
    frequency_penalty: number;
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
}

export async function getPrompt(
  id: string,
  variables: Record<string, any>,
): Promise<PortkeyResponse['data']> {
  invariant(process.env.PORTKEY_API_KEY, 'PORTKEY_API_KEY is required');

  const url = `https://api.portkey.ai/v1/prompts/${id}/render`;
  const response = await axios.post(
    url,
    { variables },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-portkey-api-key': process.env.PORTKEY_API_KEY,
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = response.data as PortkeyResponse;
  if (!result.success) {
    throw new Error(`Portkey error! ${JSON.stringify(result)}`);
  }

  return result.data;
}
