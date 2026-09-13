# 公开 Demo 部署｜谢邀喵

> 当前公开入口：`https://xieyao-meow.babelbeast.com`
>
> OAuth callback：`https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback`

## 1. 端口分配

2026-09-13 实机检查：

- `8081` 已被现有 Node 服务占用；
- `8400-8499` 属于 ContextD 的项目保留区；
- 当前其他 `8000-8099` 监听中未发现占用；
- 因此谢邀喵固定使用 `127.0.0.1:8082` 作为本机生产入口。

公网不直接暴露 `8082`，只通过 Nginx 的 80/443 反向代理访问。

## 2. systemd

服务名：

```text
xieyao-meow.service
```

关键运行参数：

```text
User=Akira
WorkingDirectory=/home/Akira/Projects/xieyao-meow
HOSTNAME=127.0.0.1
PORT=8082
NODE_ENV=production
```

项目使用 Next.js `output: "standalone"`。生产服务运行 `.next/standalone/server.js`；启动前将 `.next/static` 与 `public`（若存在）复制到 standalone 目录。

常用检查：

```bash
sudo systemctl status xieyao-meow.service
curl http://127.0.0.1:8082/api/health
```

## 3. Nginx

站点配置：

```text
/etc/nginx/sites-available/xieyao-meow
/etc/nginx/sites-enabled/xieyao-meow
```

流量关系：

```text
http://xieyao-meow.babelbeast.com
  -> 301 HTTPS

https://xieyao-meow.babelbeast.com
  -> Nginx
  -> http://127.0.0.1:8082
```

ACME challenge 使用现有公共 webroot：

```text
/var/www/certbot
```

## 4. TLS / Certbot

证书：

```text
/etc/letsencrypt/live/xieyao-meow.babelbeast.com/fullchain.pem
/etc/letsencrypt/live/xieyao-meow.babelbeast.com/privkey.pem
```

首次证书于 2026-09-13 申请成功。服务器已有启用状态的 `certbot.timer`，每天自动检查续期；现有 deploy hook 会在证书更新后执行 `nginx -t` 并 reload Nginx。

已执行：

```bash
sudo certbot renew \
  --cert-name xieyao-meow.babelbeast.com \
  --dry-run \
  --non-interactive \
  --no-random-sleep-on-renew
```

结果：续期模拟成功。

## 5. OAuth 配置

向知乎申请时固定填写：

```text
redirect_uri=https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback
```

凭证获批后必须同时配置：

```text
ZHIHU_OAUTH_APP_ID
ZHIHU_OAUTH_APP_KEY
ZHIHU_OAUTH_REDIRECT_URI=https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback
```

三项必须同时设置，避免进入半配置状态。`app_key` 不得进入 Git、前端 bundle、日志或聊天记录。

## 6. 当前公网验收

已真实验证：

```text
GET  https://xieyao-meow.babelbeast.com/            -> 200
GET  https://xieyao-meow.babelbeast.com/api/health -> status=ok
HTTP http://xieyao-meow.babelbeast.com/             -> 301 HTTPS
TLS  SAN                                              -> xieyao-meow.babelbeast.com
POST /api/experience                                 -> mode=live
```

在 OAuth `app_id/app_key` 尚未下发前：

```text
/api/auth/zhihu/status -> oauthConfigured=false
/api/auth/zhihu/start  -> 503 oauth-pending
```

这属于预期状态；Access Secret 的开发账号真实数据链路已经可用，普通用户 OAuth 等凭证下发后再做最终授权验收。
