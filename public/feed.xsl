<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="zh-TW">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS</title>
        <style>
          :root {
            --bg: #ffffff;
            --fg: #2e2e2e;
            --muted: #707070;
            --border: #e8e8e8;
            --primary: #0d7c70;
            --primary-soft: #eaf8f7;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "PingFang TC", "Microsoft JhengHei", "Helvetica Neue", Arial, sans-serif;
            color: var(--fg);
            background: var(--bg);
            line-height: 1.7;
          }
          .wrap {
            max-width: 820px;
            margin: 0 auto;
            padding: 40px 24px 72px;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 999px;
            background: var(--primary-soft);
            color: var(--primary);
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.3;
          }
          .desc {
            margin: 0 0 12px;
            color: var(--muted);
            font-size: 15px;
          }
          .meta {
            margin-bottom: 28px;
            font-size: 13px;
            color: var(--muted);
          }
          .meta a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
          }
          .hint {
            margin: 0 0 28px;
            padding: 14px 16px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: #fafafa;
            font-size: 14px;
            color: var(--muted);
          }
          .item {
            padding: 20px 0;
            border-top: 1px solid var(--border);
          }
          .item:last-child { border-bottom: 1px solid var(--border); }
          .item h2 {
            margin: 0 0 8px;
            font-size: 18px;
            line-height: 1.4;
          }
          .item h2 a {
            color: inherit;
            text-decoration: none;
          }
          .item h2 a:hover { color: var(--primary); }
          .item p {
            margin: 0 0 10px;
            color: var(--muted);
            font-size: 14px;
          }
          .item time {
            font-size: 13px;
            color: #9a9a9a;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="eyebrow">RSS Feed</div>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
          <p class="meta">
            網站：
            <a href="{/rss/channel/link}"><xsl:value-of select="/rss/channel/link"/></a>
          </p>
          <p class="hint">
            這是 WPORT Blog 的 RSS 訂閱來源。你可以把這個網址貼到 Feedly、Inoreader 或其他 RSS 閱讀器訂閱最新文章。
          </p>
          <xsl:for-each select="/rss/channel/item">
            <article class="item">
              <h2>
                <a href="{link}" rel="noopener">
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <p><xsl:value-of select="description"/></p>
              <time><xsl:value-of select="pubDate"/></time>
            </article>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
