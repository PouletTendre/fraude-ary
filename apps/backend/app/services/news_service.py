"""Financial news aggregation from Yahoo Finance."""

import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime


async def get_news(symbol: str, limit: int = 10) -> List[Dict[str, Optional[str]]]:
    """Fetch news for a symbol from Yahoo Finance RSS feed."""
    symbol_upper = symbol.upper()
    items: List[Dict[str, Optional[str]]] = []

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                f"https://feeds.finance.yahoo.com/rss/2.0/headline",
                params={"s": symbol_upper, "region": "US", "lang": "en-US"},
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if resp.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(resp.text)
                channel = root.find("channel")
                if channel is not None:
                    for item_elem in channel.findall("item")[:limit]:
                        title_elem = item_elem.find("title")
                        link_elem = item_elem.find("link")
                        pub_date_elem = item_elem.find("pubDate")
                        source_elem = item_elem.find("source")

                        items.append({
                            "title": title_elem.text if title_elem is not None else "",
                            "link": link_elem.text if link_elem is not None else "",
                            "published": pub_date_elem.text if pub_date_elem is not None else None,
                            "source": source_elem.text if source_elem is not None else "Yahoo Finance",
                        })
    except Exception as e:
        logging.warning(f"Yahoo RSS news failed for {symbol_upper}: {e}")

    if not items:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    "https://query1.finance.yahoo.com/v1/finance/search",
                    params={"q": symbol_upper, "quotesCount": 0, "newsCount": limit},
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    news_list = data.get("news", [])
                    for news_item in news_list[:limit]:
                        items.append({
                            "title": news_item.get("title", ""),
                            "link": news_item.get("link", ""),
                            "published": news_item.get("providerPublishTime") if news_item.get("providerPublishTime") else None,
                            "source": news_item.get("publisher", "Yahoo Finance"),
                        })
        except Exception as e:
            logging.warning(f"Yahoo search news failed for {symbol_upper}: {e}")

    return items
