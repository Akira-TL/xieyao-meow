# 知乎数据开放平台官方接口文档本地快照

> 快照日期：2026-09-12  
> 官方入口：`https://developer.zhihu.com/docs`

本目录保存「谢邀喵」当前使用或可能使用的知乎数据开放平台官方页面文本快照，让 Agent、开发者和本地搜索工具无需重新打开网页即可检索接口合同。

## 使用规则

- `docs/reference/zhihu-api.md` 是本项目的集成说明与架构解释。
- 本目录是官方页面正文快照，用于核对 endpoint、参数、响应、错误码和配额语义。
- 实现代码不得依据记忆猜测字段；优先检索本目录，再在必要时核对线上官方文档。
- 如果本地快照与线上文档冲突，以线上官方文档最新版为准，并同步更新本目录。
- Secret、OAuth token、authorization code 和真实用户返回内容不得写入这里。

## 索引

| 能力 | 本地文档 | 官方 key |
|---|---|---|
| Bearer 鉴权 | `core/authorization.md` | `authorization` |
| 额度查询 | `core/quota.md` | `quota` |
| 知乎搜索 | `content/zhihu-search.md` | `zhihu_search` |
| 直答 | `agent/zhida.md` | `zhida` |
| 热榜 | `content/hot-list.md` | `hot_list` |
| 问题推荐 | `creator/question-recommendations.md` | `question_recommendations` |
| 问题回答 | `content/question-answers.md` | `question_answers` |
| 我的创作全文 | `creator/user-content-detail.md` | `user_content_detail` |
| 我的创作评论 | `creator/user-content-comments.md` | `user_content_comments` |
| 账号创作数据 | `creator/creator-account-stats.md` | `creator_account_stats` |
| 单篇创作数据 | `creator/creator-content-stats.md` | `creator_content_stats` |
| OAuth | `core/oauth.md` | `zhihu_oauth_integrated` |
| 用户内容 | `user/user-contents.md` | `user_contents` |
| 用户关注 | `user/user-followees.md` | `user_followees` |
| 用户收藏 | `user/user-collections.md` | `user_collections` |
| 用户收藏夹列表 | `user/user-favlists.md` | `user_favlists` |
| 收藏夹内容 | `user/favlist-contents.md` | `favlist_contents` |

## 本地搜索示例

```bash
rg 'X-OAuth-Token|X-Request-Timestamp' docs/reference/zhihu-open-platform
rg '30001|30002|30003' docs/reference/zhihu-open-platform
rg 'HTTP URL|HTTP Method' docs/reference/zhihu-open-platform
rg 'Limit|Offset|Count' docs/reference/zhihu-open-platform
```
