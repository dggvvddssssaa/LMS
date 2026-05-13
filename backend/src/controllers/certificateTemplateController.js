const db = require('../config/db');

exports.getAllTemplates = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM certificate_templates ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM certificate_templates WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { 
      name, type, status, layout_json, background_url, logo_url, seal_url, 
      signature_url, issuer_name, issuer_title, representative_name, representative_title 
    } = req.body;
    
    const { rows } = await db.query(
      `INSERT INTO certificate_templates (
        name, type, status, layout_json, background_url, logo_url, seal_url, 
        signature_url, issuer_name, issuer_title, representative_name, representative_title, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        name || 'Untitled Template', type || 'completion', status || 'draft',
        layout_json ? JSON.stringify(layout_json) : null, background_url, logo_url, seal_url,
        signature_url, issuer_name, issuer_title, representative_name, representative_title, req.user.id
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, type, status, layout_json, background_url, logo_url, seal_url, 
      signature_url, issuer_name, issuer_title, representative_name, representative_title 
    } = req.body;
    
    const { rows } = await db.query(
      `UPDATE certificate_templates SET 
        name = COALESCE($1, name), 
        type = COALESCE($2, type), 
        status = COALESCE($3, status), 
        layout_json = COALESCE($4, layout_json), 
        background_url = COALESCE($5, background_url), 
        logo_url = COALESCE($6, logo_url), 
        seal_url = COALESCE($7, seal_url), 
        signature_url = COALESCE($8, signature_url), 
        issuer_name = COALESCE($9, issuer_name), 
        issuer_title = COALESCE($10, issuer_title), 
        representative_name = COALESCE($11, representative_name), 
        representative_title = COALESCE($12, representative_title),
        updated_at = NOW()
      WHERE id = $13 RETURNING *`,
      [
        name, type, status, layout_json ? JSON.stringify(layout_json) : null, 
        background_url, logo_url, seal_url, signature_url, 
        issuer_name, issuer_title, representative_name, representative_title, id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM certificate_templates WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM certificate_templates WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Template not found' });
    
    const t = rows[0];
    const newName = `${t.name} (Copy)`;
    
    const { rows: newRows } = await db.query(
      `INSERT INTO certificate_templates (
        name, type, status, layout_json, background_url, logo_url, seal_url, 
        signature_url, issuer_name, issuer_title, representative_name, representative_title, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        newName, t.type, 'draft', JSON.stringify(t.layout_json), t.background_url, t.logo_url, t.seal_url,
        t.signature_url, t.issuer_name, t.issuer_title, t.representative_name, t.representative_title, req.user.id
      ]
    );
    res.status(201).json({ success: true, data: newRows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
