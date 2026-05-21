const certificateTemplateRepo = require('../repositories/CertificateTemplateRepository');

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await certificateTemplateRepo.getAll();
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    const template = await certificateTemplateRepo.getById(id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(200).json({ success: true, data: template });
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

    const template = await certificateTemplateRepo.create({
      name, type, status, layout_json, background_url, logo_url, seal_url,
      signature_url, issuer_name, issuer_title, representative_name, representative_title,
      created_by: req.user.id
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    const { 
      name, type, status, layout_json, background_url, logo_url, seal_url, 
      signature_url, issuer_name, issuer_title, representative_name, representative_title 
    } = req.body;

    const template = await certificateTemplateRepo.update(id, {
      name, type, status, layout_json, background_url, logo_url, seal_url,
      signature_url, issuer_name, issuer_title, representative_name, representative_title
    });
    res.status(200).json({ success: true, data: template });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    await certificateTemplateRepo.delete(id);
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicateTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    const template = await certificateTemplateRepo.duplicate(id, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
