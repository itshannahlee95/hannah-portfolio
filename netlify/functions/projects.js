exports.handler = async function(event, context) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = process.env.DATABASE_ID;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const category = params.category;

  try {
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: data.message })
      };
    }

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(projects)
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
