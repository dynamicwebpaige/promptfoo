const axios = require('axios');

class CustomApiProvider {
  constructor(options) {
    // The caller may override Provider ID (e.g. when using multiple instances of the same provider)
    this.providerId = options.id || 'custom provider';

    // The config object contains any options passed to the provider in the config file.
    this.config = options.config;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt) {
    return null;
  }

  async callEmbeddingApi(prompt) {
    const body = {
      model: 'text-embedding-3-large',
      input: prompt,
    };
    const response = await axios.post('https://api.openai.com/v1/embeddings', body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const data = response.data;
    if (!data) {
      return {
        error: 'Unknown error',
      };
    }
    const ret = {
      embedding: data.data[0].embedding,
      tokenUsage: {
        total: data.usage.total_tokens,
        prompt: data.usage.prompt_tokens,
        completion: 0,
      },
    };
    return ret;
  }
}

module.exports = CustomApiProvider;
