// Notion API 串接核心
// 透過 Vercel Serverless Function 代理請求（避免 CORS 問題）

async function fetchProjects(category) {
  try {
    const res = await fetch('/api/projects' + (category ? '?category=' + category : ''));
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch(e) {
    console.error('Failed to fetch projects:', e);
    return [];
  }
}

function renderProjectList(projects, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = '<div style="padding:3rem 0;color:#888;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase">No projects yet</div>';
    return;
  }

  container.innerHTML = projects.map((p, i) => `
    <a class="proj-item" href="${p.link || '#'}" ${p.link ? 'target="_blank"' : ''}
       data-thumb="${p.cover || ''}">
      <div class="proj-num">${String(i+1).padStart(2,'0')}</div>
      <div class="proj-main">
        <div class="proj-title">${p.title}${p.script ? ` <span class="proj-script">${p.script}</span>` : ''}</div>
        <div class="proj-meta">${p.category || ''}${p.category && p.year ? ' · ' : ''}${p.year || ''}</div>
        ${p.tags && p.tags.length ? `
        <div class="proj-tags">
          ${p.tags.map(t => `<span class="ptag">${t}</span>`).join('')}
        </div>` : ''}
      </div>
      <div class="proj-arrow">↗</div>
    </a>
  `).join('');

  // Re-attach hover thumb listeners
  const thumb = document.getElementById('thumbHover');
  if (thumb) {
    container.querySelectorAll('.proj-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const src = el.dataset.thumb;
        if (src) { thumb.src = src; thumb.style.opacity = '1'; }
      });
      el.addEventListener('mouseleave', () => {
        thumb.style.opacity = '0';
      });
    });
  }
}
