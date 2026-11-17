const axios = require('axios');
const config = require('../config');

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: config.aiServiceUrl,
      timeout: 35000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': config.aiServiceSecret
      }
    });
  }

  async checkHealth() {
    try {
      const res = await this.client.get('/health');
      return res.data;
    } catch (error) {
      return { status: 'offline', error: error.message };
    }
  }

  async runPipeline(text, options = {}) {
    try {
      const payload = {
        text,
        max_results_per_claim: options.maxResults || 5,
        include_full_text: options.includeFullText || false
      };

      const res = await this.client.post('/verify/pipeline', payload);
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'End-to-End Verification Pipeline');
    }
  }

  async extractClaims(text) {
    try {
      const res = await this.client.post('/analyze/extract-claims', { text });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'Claim Extraction');
    }
  }

  async searchEvidence(claim, maxResults = 5) {
    try {
      const res = await this.client.post('/evidence/search', { claim, max_results: maxResults });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'Evidence Discovery');
    }
  }

  async evaluateClaim(claim, evidence = []) {
    try {
      const res = await this.client.post('/verify/evaluate-claim', { claim, evidence });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'Verdict Evaluation');
    }
  }

  async investigateUrl(url, maxClaims = 5) {
    try {
      const res = await this.client.post('/media/url-investigate', {
        url,
        max_claims: maxClaims
      });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'URL Article Investigation');
    }
  }

  async investigateArticle(text, title = null, maxClaims = 8) {
    try {
      const res = await this.client.post('/media/article-investigate', {
        text,
        title,
        max_claims: maxClaims
      });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'Long-Form Article Investigation');
    }
  }

  async investigateImage(imageBuffer, filename = 'upload.jpg', caption = '') {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer]);
      formData.append('file', blob, filename);
      if (caption) {
        formData.append('caption', caption);
      }

      const res = await this.client.post('/media/image-investigate', formData, {
        headers: {
          // Let axios set the multipart boundary automatically
          'Content-Type': undefined
        }
      });
      return res.data;
    } catch (error) {
      this._handleAxiosError(error, 'Image Media Investigation');
    }
  }

  _handleAxiosError(error, operationName) {
    if (error.code === 'ECONNREFUSED') {
      const err = new Error(`Python AI verification microservice is currently unreachable at ${config.aiServiceUrl}`);
      err.statusCode = 503;
      throw err;
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const err = new Error(`${operationName} timed out while waiting for AI microservice response.`);
      err.statusCode = 504;
      throw err;
    }
    if (error.response) {
      const msg = error.response.data?.detail || error.response.data?.error?.message || `AI Microservice returned error ${error.response.status}`;
      const err = new Error(msg);
      err.statusCode = error.response.status >= 500 ? 502 : error.response.status;
      throw err;
    }
    throw error;
  }
}

module.exports = new AIService();

