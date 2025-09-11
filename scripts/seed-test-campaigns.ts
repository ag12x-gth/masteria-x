
// scripts/seed-test-campaigns.ts
import { db, conn } from '../src/lib/db';
import redis from '../src/lib/redis';
import { campaigns, companies, connections, contactLists, smsGateways, templates } from '../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const WHATSAPP_CAMPAIGN_QUEUE = 'whatsapp_campaign_queue';
const SMS_CAMPAIGN_QUEUE = 'sms_campaign_queue';
const TOTAL_CAMPAIGNS = 200;

async function seedTestCampaigns() {
  console.log(`🔥 Iniciando a criação de ${TOTAL_CAMPAIGNS} campanhas de teste...`);

  try {
    // 1. Obter dados essenciais (empresa, conexão, template, etc.)
    const [company] = await db.select().from(companies).limit(1);
    if (!company) throw new Error('Nenhuma empresa encontrada para associar as campanhas.');

    const [whatsConnection] = await db.select().from(connections).where(and(eq(connections.companyId, company.id), eq(connections.isActive, true))).limit(1);
    if (!whatsConnection) throw new Error('Nenhuma conexão WhatsApp ativa encontrada.');
    
    const [template] = await db.select().from(templates).where(eq(templates.wabaId, whatsConnection.wabaId)).limit(1);
    if (!template) throw new Error('Nenhum modelo de mensagem encontrado para a conexão ativa.');

    const [smsGateway] = await db.select().from(smsGateways).where(eq(smsGateways.companyId, company.id)).limit(1);
    if (!smsGateway) throw new Error('Nenhum gateway de SMS encontrado.');
    
    const [list] = await db.select().from(contactLists).where(eq(contactLists.companyId, company.id)).limit(1);
    if (!list) throw new Error('Nenhuma lista de contatos encontrada.');

    // 2. Gerar e inserir campanhas de teste
    const testCampaigns = [];
    for (let i = 1; i <= TOTAL_CAMPAIGNS; i++) {
        const isSms = i % 2 === 0;
        testCampaigns.push({
            id: randomUUID(),
            companyId: company.id,
            name: `[TEST] Campanha Prova de Carga #${i}`,
            channel: isSms ? 'SMS' : 'WHATSAPP',
            status: 'QUEUED',
            message: isSms ? 'Esta é uma mensagem de teste para a campanha de carga.' : null,
            templateId: isSms ? null : template.id,
            connectionId: isSms ? null : whatsConnection.id,
            smsGatewayId: isSms ? smsGateway.id : null,
            contactListIds: [list.id],
            createdAt: new Date(),
        });
    }

    if (testCampaigns.length > 0) {
        await db.insert(campaigns).values(testCampaigns);
        console.log(`✅ ${testCampaigns.length} campanhas inseridas no banco de dados.`);
    }

    // 3. Enfileirar no Redis
    const whatsappCampaigns = testCampaigns.filter(c => c.channel === 'WHATSAPP').map(c => c.id);
    const smsCampaigns = testCampaigns.filter(c => c.channel === 'SMS').map(c => c.id);

    if (whatsappCampaigns.length > 0) {
        await redis.lpush(WHATSAPP_CAMPAIGN_QUEUE, ...whatsappCampaigns);
        console.log(`📲 ${whatsappCampaigns.length} campanhas de WhatsApp enfileiradas.`);
    }
    if (smsCampaigns.length > 0) {
        await redis.lpush(SMS_CAMPAIGN_QUEUE, ...smsCampaigns);
        console.log(`💬 ${smsCampaigns.length} campanhas de SMS enfileiradas.`);
    }

    console.log('🚀 Teste de carga preparado com sucesso! Inicie o worker para processar a fila.');

  } catch (error) {
    console.error('❌ Erro ao gerar campanhas de teste:', error);
  } finally {
    await conn.end();
    await redis.quit();
  }
}

seedTestCampaigns();
