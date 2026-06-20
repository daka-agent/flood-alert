/**
 * flood-alert-api — Gitee Issues 代理云函数（腾讯云 CloudBase）
 * 将 Gitee Token 保存在服务端，前端不暴露任何密钥
 */

const GITEE_OWNER = 'duobaozhang';
const GITEE_REPO  = 'flood-alert';
const GITEE_TOKEN = '927b7f230b6f9e68c74ad28c0e55f7b5';
const GITEE_API   = 'https://gitee.com/api/v5';

exports.main = async (event, context) => {
  const { httpMethod, path, queryStringParameters: qs } = event;
  const body = event.body ? JSON.parse(event.body) : null;

  // 设置 CORS 响应头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // CORS 预检
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // GET /issues — 读取 Issues 列表
    if (path && path.includes('issues') && httpMethod === 'GET') {
      const res = await fetch(`${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues?state=open&per_page=100&access_token=${GITEE_TOKEN}`);
      const data = await res.json();
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // POST /issues — 创建 Issue（提交上报）
    if (path && path.includes('issues') && httpMethod === 'POST') {
      const res = await fetch(
        `${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues?access_token=${GITEE_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          body: JSON.stringify({
            title: body.title,
            body: body.body,
          }),
        }
      );
      const data = await res.json();
      return { statusCode: res.status || 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // PATCH /issues/:id — 关闭 Issue（删除上报）
    if (path && path.match(/issues\/\d+/) && httpMethod === 'PATCH') {
      const pwd = qs ? qs.pwd : '';
      if (pwd !== 'admin888') {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: '密码错误' }) };
      }
      const match = path.match(/\/issues\/(\d+)/);
      const issueId = match[1];
      const res = await fetch(
        `${GITEE_API}/repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${issueId}?access_token=${GITEE_TOKEN}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          body: JSON.stringify({ state: 'closed' }),
        }
      );
      const data = await res.json();
      return { statusCode: res.status || 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Not Found' }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
