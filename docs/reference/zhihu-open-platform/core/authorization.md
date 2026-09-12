# Bearer 鉴权

> 来源：知乎数据开放平台官方文档
>
> 官方页面：`https://developer.zhihu.com/docs?key=authorization`
>
> 本地快照日期：2026-09-12
>
> 以下正文为官方页面可见文本快照，用于项目内检索；若与线上文档冲突，以线上最新版为准。

---

说明

知乎开放平台当前推荐通过 Authorization: Bearer <your_access_secret> 的方式调用数据接口。

对于 zhihu_search、global_search、hot_list 等接口，调用时统一使用 Bearer 鉴权即可。

获取 Access Secret

请在知乎开放平台个人中心查看并获取 Access Secret

说明：

调用方需要将 Access Secret 作为 Bearer Token 放入请求头。
服务端会校验 Authorization 与 X-Request-Timestamp。
X-Request-Timestamp 需要传秒级 Unix 时间戳。
请求头示例
名称	示例值	说明
Authorization	Bearer <your_access_secret>	Bearer 鉴权头
X-Request-Timestamp	1742822400	秒级 Unix 时间戳
Content-Type	application/json	JSON 接口固定值
Curl 示例
curl -G 'https://developer.zhihu.com/api/v1/content/zhihu_search' \
  --data-urlencode 'Query=怎么理解rave文化' \
  -H 'Authorization: Bearer <your_access_secret>' \
  -H "X-Request-Timestamp: $(date +%s)" \
  -H 'Content-Type: application/json'
