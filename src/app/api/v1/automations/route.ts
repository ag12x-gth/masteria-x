
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { automationRules } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCompanyIdFromSession } from '@/app/actions';
import { z } from 'zod';
import type { AutomationCondition, AutomationAction } from '@/lib/db/schema';

// Schema mais flexível para validação de entrada
const conditionSchema = z.object({
  type: z.enum(['contact_tag', 'message_content', 'contact_list', 'conversation_status']),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'exists', 'not_exists']),
  value: z.union([z.string(), z.number(), z.null()]).optional(),
}).passthrough();

const actionSchema = z.object({
  type: z.enum(['send_message', 'add_tag', 'assign_user', 'add_to_list']),
  value: z.string().optional(),
}).passthrough();

const ruleSchema = z.object({
  name: z.string().min(1, 'Nome da regra é obrigatório'),
  triggerEvent: z.string().min(1, 'O evento gatilho é obrigatório'),
  connectionIds: z.array(z.string()).nullable().optional(),
  conditions: z.array(conditionSchema),
  actions: z.array(actionSchema).min(1, 'É necessária pelo menos uma ação.'),
  isActive: z.boolean().default(true),
});

// GET /api/v1/automations
export async function GET(_request: NextRequest) {
    try {
        const companyId = await getCompanyIdFromSession();
        const rules = await db
            .select()
            .from(automationRules)
            .where(eq(automationRules.companyId, companyId))
            .orderBy(desc(automationRules.createdAt));
        
        return NextResponse.json(rules);

    } catch (error) {
        console.error('Erro ao buscar regras de automação:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// POST /api/v1/automations
export async function POST(request: NextRequest) {
    try {
        const companyId = await getCompanyIdFromSession();
        const body = await request.json();
        const parsed = ruleSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 });
        }
        
        const { name, triggerEvent, conditions, actions, isActive, connectionIds } = parsed.data;
        
        const finalConditions = conditions.map(({ id, ...rest }) => rest);
        const finalActions = actions.map(({ id, ...rest }) => rest);

        const [newRule] = await db.insert(automationRules).values({
            companyId,
            name,
            triggerEvent,
            connectionIds: connectionIds || null,
            conditions: finalConditions as AutomationCondition[],
            actions: finalActions as AutomationAction[],
            isActive
        }).returning();

        return NextResponse.json(newRule, { status: 201 });

    } catch (error) {
         console.error('Erro ao criar regra de automação:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
