// Vercel Serverless Function
// 這個檔案放在 Vercel 上執行，幫你的網站跟 Notion API 溝通

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID  = process.env.DATABASE_ID;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { category } = req.query;

  try {
    // 建立 Notion API 查詢條件
    const filter = {
      and: [
        { property: 'Published', checkbox: { equals: true } }
      ]
    };

    if (category) {
      filter.and.push({
        property: 'Category',
        select: { equals: category }
      });
    }

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter,
        sorts: [{ property: 'Year', direction: 'descending' }]
      })
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      return res.status(500).json({ error: data.message });
    }

    // 整理資料格式
    const projects = data.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        title: props['名稱']?.title?.[0]?.plain_text || '',
        script: props['Script']?.rich_text?.[0]?.plain_text || '',
        category: props['Category']?.select?.name || '',
        year: props['Year']?.number || '',
        tags: props['Tags']?.multi_select?.map(t => t.name) || [],
        description: props['Description']?.rich_text?.[0]?.plain_text || '',
        cover: props['Cover']?.files?.[0]?.file?.url || props['Cover']?.files?.[0]?.external?.url || '',
        link: props['Link']?.url || '',
      };
    });

    res.status(200).json(projects);

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
