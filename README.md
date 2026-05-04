# QuickStack

自托管 PaaS 平台，免费开源的 Heroku 替代方案。

## 功能特性
- 应用一键部署
- Docker 容器管理
- 域名绑定
- 环境变量管理
- 中文界面

## 快速部署
```bash
docker run -d -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock --name quickstack wsng911/quickstack:latest
```
访问 `http://localhost:3000`
