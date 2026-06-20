/**
 * flood-alert-api — Gitee Issues 代理（Netlify Function）
 * 单函数处理所有请求，通过 HTTP method 区分操作
 *
 * 前端调用：
 *   GET   /.netlify/functions/api                          — 读取列表
 *   POST  /.netlify/functions/api                          — 创建上报
 *   PATCH /.netlify/functions/api?action=delete&id=123&pwd=xxx — 删除上报
 */

const GITEE_OWNER = 'duobaozhang';
const GITEE_REPO  = 'flood-alert';
const GITEE_TOKEN = '927b7f230b6f9e68c74ad28c0e55f7b5';
const GITEE_API   = 'https://gitee.com/api/v5';

// Node 18+ 内置 fetch；低版本降级用 https 模块
let _fetch;
try {
  _fetch = fetch;
} catch (e) {
  _fetch = null;
}

async function nodeFetch(url, options = {}) {
  if (_fetch) return _fetch(url, options);

  // 降级：用 Node.js 内置 https 模块
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
        json: () => Promise.resolve(JSON.parse(data)),
        text: () => Promise.resolve(data),
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
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
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // GET — 读取 Issues 列表
    if (httpMethod === 'GET') {
      const apiUrl = `${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues?state=open&per_page=100&access_token=${GITEE_TOKEN}`;
      const res = await nodeFetch(apiUrl);
      const data = await res.json();
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // POST — 创建 Issue（提交上报）
    if (httpMethod === 'POST') {
      const apiUrl = `${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues?access_token=${GITEE_TOKEN}`;
      const res = await nodeFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        body: JSON.stringify({ title: body.title, body: body.body }),
      });
      const data = await res.json();
      return { statusCode: res.status || 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // PATCH — 关闭 Issue（删除上报），通过查询参数传 id 和 pwd
    if (httpMethod === 'PATCH') {
      const issueId = qs.id;
      const pwd = qs.pwd || '';
      if (pwd !== 'admin888') {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: '密码错误' }) };
      }
      if (!issueId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: '缺少 id 参数' }) };
      }
      const apiUrl = `${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${issueId}?access_token=${GITEE_TOKEN}`;
      const res = await nodeFetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        body: JSON.stringify({ state: 'closed' }),
      });
      const data = await res.json();
      return { statusCode: res.status || 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Not Found', method: httpMethod }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
