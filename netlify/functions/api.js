/**
 * flood-alert-api — GitHub Issues 代理（Netlify Function）
 * 单函数处理所有请求，通过 HTTP method 区分操作
 *
 * 前端调用：
 *   GET   /.netlify/functions/api                          — 读取列表
 *   POST  /.netlify/functions/api                          — 创建上报
 *   PATCH /.netlify/functions/api?action=delete&id=123&pwd=xxx — 删除上报
 */

const GH_OWNER = 'daka-agent';
const GH_REPO  = 'flood-alert';
const GH_TOKEN  = process.env.GH_TOKEN;
const GH_API    = 'https://api.github.com';

// Node 18+ 内置 fetch
let _fetch;
try { _fetch = fetch; } catch(e) { _fetch = null; }

async function safeFetch(url, options = {}) {
  if (_fetch) return _fetch(url, options);
  // 降级：Node https 模块
  const https = require('https');
  const { URL } = require('url');
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        statusText: res.statusMessage,
        json: () => Promise.resolve(JSON.parse(data)),
        text: () => Promise.resolve(data),
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// GitHub API 通用请求头
function ghHeaders(extra = {}) {
  return {
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'flood-alert-app',
    ...extra,
  };
}

exports.handler = async (event, context) => {
  const httpMethod = event.httpMethod;
  const qs = event.queryStringParameters || {};
  let body = null;
  try { body = event.body ? JSON.parse(event.body) : null; } catch(e) {}

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // GET — 读取 Issues 列表（open 状态）
    if (httpMethod === 'GET') {
      const apiUrl = `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/issues?state=open&per_page=100`;
      const res = await safeFetch(apiUrl, { headers: ghHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(data)}`);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // POST — 创建 Issue（提交上报）
    if (httpMethod === 'POST') {
      const apiUrl = `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/issues`;
      const res = await safeFetch(apiUrl, {
        method: 'POST',
        headers: ghHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: body.title, body: body.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(data)}`);
      return { statusCode: res.status || 201, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // PATCH — 关闭 Issue（删除上报）
    if (httpMethod === 'PATCH') {
      const issueId = qs.id;
      const pwd = qs.pwd || '';
      if (pwd !== 'admin888') {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: '密码错误' }) };
      }
      if (!issueId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: '缺少 id 参数' }) };
      }
      const apiUrl = `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/issues/${issueId}`;
      const res = await safeFetch(apiUrl, {
        method: 'PATCH',
        headers: ghHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ state: 'closed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(data)}`);
      return { statusCode: res.status || 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Not Found', method: httpMethod }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
