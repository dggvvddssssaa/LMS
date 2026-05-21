const prisma = require('../config/prisma');

class CertificateTemplateRepository {
  async getAll() {
    return prisma.certificate_templates.findMany({ orderBy: { created_at: 'desc' } });
  }

  async getById(id) {
    return prisma.certificate_templates.findUnique({ where: { id: Number(id) } });
  }

  async create(data) {
    return prisma.certificate_templates.create({
      data: {
        name: data.name || 'Untitled Template',
        type: data.type || 'completion',
        status: data.status || 'draft',
        layout_json: data.layout_json || null,   // Pass object directly, Prisma handles Json type
        background_url: data.background_url || null,
        logo_url: data.logo_url || null,
        seal_url: data.seal_url || null,
        signature_url: data.signature_url || null,
        issuer_name: data.issuer_name || null,
        issuer_title: data.issuer_title || null,
        representative_name: data.representative_name || null,
        representative_title: data.representative_title || null,
        created_by: data.created_by || null
      }
    });
  }

  async update(id, data) {
    // Build update object with only provided fields (COALESCE equivalent)
    const updateData = {};
    const fields = ['name', 'type', 'status', 'layout_json', 'background_url', 'logo_url',
      'seal_url', 'signature_url', 'issuer_name', 'issuer_title', 'representative_name', 'representative_title'];
    for (const field of fields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    return prisma.certificate_templates.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async delete(id) {
    return prisma.certificate_templates.delete({ where: { id: Number(id) } });
  }

  async duplicate(id, createdBy) {
    const original = await this.getById(id);
    if (!original) return null;
    const { id: _id, created_at, updated_at, ...rest } = original;
    return prisma.certificate_templates.create({
      data: {
        ...rest,
        name: `${original.name} (Copy)`,
        status: 'draft',
        created_by: createdBy
      }
    });
  }
}

module.exports = new CertificateTemplateRepository();
