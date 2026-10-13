export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

// ============================================================
// GET - List content items
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';

    let items;
    if (type === 'library') {
      items = await sql`
        SELECT 
          ci.*,
          cc.name as category_name,
          cc.slug as category_slug
        FROM content_items ci
        JOIN content_categories cc ON ci.category_id = cc.id
        WHERE ci.content_type != 'guide'
        ORDER BY ci.created_at DESC
      `;
    } else if (type === 'guide') {
      items = await sql`
        SELECT 
          ci.*,
          cc.name as category_name,
          cc.slug as category_slug
        FROM content_items ci
        JOIN content_categories cc ON ci.category_id = cc.id
        WHERE ci.content_type = 'guide'
        ORDER BY ci.created_at DESC
      `;
    } else {
      items = await sql`
        SELECT 
          ci.*,
          cc.name as category_name,
          cc.slug as category_slug
        FROM content_items ci
        JOIN content_categories cc ON ci.category_id = cc.id
        ORDER BY ci.created_at DESC
      `;
    }

    const categories = await sql`
      SELECT * FROM content_categories WHERE is_active = true ORDER BY display_order
    `;

    return new Response(JSON.stringify({
      success: true,
      items: items || [],
      categories: categories || [],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin content GET error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============================================================
// POST - Add new content (robust: handles missing columns)
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    console.log('📦 Received content data:', body);

    const { 
      title, 
      description, 
      content_type, 
      category_id, 
      author,
      file_url,
      thumbnail_url,
      link_type,
      is_premium,
      price,
      steps,
      tips
    } = body;

    if (!title || !content_type || !category_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Title, content type, and category are required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    // ✅ Build content data with only safe columns
    const contentData: Record<string, any> = {
      category_id: category_id,
      title: title,
      slug: slug,
      description: description || '',
      content_type: content_type,
      author: author || 'Wisdom Vault',
      is_published: true,
      file_url: file_url || '',
      thumbnail_url: thumbnail_url || '',
    };

    // ✅ Try to add extended columns (they may not exist yet)
    try {
      // Check if extended columns exist
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name IN ('link_type', 'is_premium', 'price', 'steps', 'tips')
      `;
      const existingCols = colCheck.map((c: any) => c.column_name);

      if (existingCols.includes('link_type')) {
        contentData.link_type = link_type || 'url';
      }
      if (existingCols.includes('is_premium')) {
        contentData.is_premium = is_premium || false;
      }
      if (existingCols.includes('price')) {
        contentData.price = is_premium ? (parseFloat(price) || 0) : 0;
      }
    } catch (e) {
      // If column check fails, proceed with basic columns only
      console.log('⚠️ Could not check extended columns, using basic columns only');
    }

    // ✅ For guides, store steps and tips as JSON
    if (content_type === 'guide') {
      try {
        const colCheck = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'content_items' 
          AND column_name IN ('steps', 'tips')
        `;
        const existingCols = colCheck.map((c: any) => c.column_name);

        if (existingCols.includes('steps') && steps) {
          if (Array.isArray(steps)) {
            contentData.steps = JSON.stringify(steps);
          } else if (typeof steps === 'string') {
            const stepsArray = steps.split('\n').filter((s) => s.trim());
            contentData.steps = JSON.stringify(stepsArray);
          }
        }
        
        if (existingCols.includes('tips') && tips) {
          if (Array.isArray(tips)) {
            contentData.tips = JSON.stringify(tips);
          } else if (typeof tips === 'string') {
            const tipsArray = tips.split('\n').filter((s) => s.trim());
            contentData.tips = JSON.stringify(tipsArray);
          }
        }
      } catch (e) {
        console.log('⚠️ Could not check guide columns');
      }
      
      console.log('📝 Steps to save:', contentData.steps);
      console.log('💡 Tips to save:', contentData.tips);
    }

    // ✅ Get columns and values
    const columns = Object.keys(contentData);
    const values = Object.values(contentData);

    // ✅ Build the INSERT query manually
    const columnNames = columns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `INSERT INTO content_items (${columnNames}) VALUES (${placeholders}) RETURNING id`;
    
    console.log('📝 Query:', query);
    console.log('📝 Values:', values);

    // ✅ Execute the query
    const result = await sql.unsafe(query, values);

    console.log('✅ Content added successfully! ID:', result[0]?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Content added successfully!',
      id: result[0]?.id 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ Admin content POST error:', err);
    console.error('❌ Error stack:', err.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============================================================
// DELETE - Remove content
// ============================================================
export const DELETE: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return new Response(JSON.stringify({ success: false, message: 'Content ID required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`
      DELETE FROM content_items WHERE id = ${contentId}
    `;

    return new Response(JSON.stringify({ success: true, message: 'Content deleted successfully' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin content DELETE error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
