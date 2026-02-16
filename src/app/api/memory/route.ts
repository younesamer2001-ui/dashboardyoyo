import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// GET - Fetch memory (facts, entities, preferences) with optional search
export async function GET(request: NextRequest) {
    try {
        const data = await readData();
        const memory = data.memory || { facts: [], entities: [], preferences: [], relationships: [] };
        const url = new URL(request.url);
        const q = url.searchParams.get('q');

        if (q) {
            const query = q.toLowerCase();
            const filteredFacts = memory.facts.filter((f: any) =>
                f.entity.toLowerCase().includes(query) ||
                f.predicate.toLowerCase().includes(query) ||
                f.object.toLowerCase().includes(query)
            );
            const filteredEntities = memory.entities.filter((e: any) =>
                e.name.toLowerCase().includes(query) ||
                (e.description && e.description.toLowerCase().includes(query))
            );
            const filteredPrefs = memory.preferences.filter((p: any) =>
                p.key.toLowerCase().includes(query) ||
                p.value.toLowerCase().includes(query)
            );
            return Response.json({
                facts: filteredFacts,
                entities: filteredEntities,
                preferences: filteredPrefs,
                relationships: memory.relationships,
                query: q
            });
        }

        return Response.json(memory);
    } catch (error) {
        console.error('Memory GET error:', error);
        return Response.json({ facts: [], entities: [], preferences: [], relationships: [] });
    }
}

// POST - Add fact, entity, or preference manually
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data: itemData } = body;
        const data = await readData();

        if (!data.memory) {
            data.memory = { facts: [], entities: [], preferences: [], relationships: [] };
        }

        const now = new Date().toISOString();
        const id = `${type}-${Date.now()}`;

        switch (type) {
            case 'fact': {
                const fact = {
                    id,
                    entity: itemData.entity,
                    predicate: itemData.predicate,
                    object: itemData.object,
                    source: itemData.source || 'user_input',
                    confidence: itemData.confidence || 0.9,
                    extractedAt: now,
                    lastMentioned: now
                };
                data.memory.facts.push(fact);
                break;
            }
            case 'entity': {
                const entity = {
                    id,
                    type: itemData.type || 'concept',
                    name: itemData.name,
                    description: itemData.description || '',
                    properties: itemData.properties || {},
                    mentionCount: 1,
                    lastMentioned: now
                };
                data.memory.entities.push(entity);
                break;
            }
            case 'preference': {
                // Check if preference already exists
                const existing = data.memory.preferences.findIndex((p: any) => p.key === itemData.key);
                if (existing >= 0) {
                    data.memory.preferences[existing].value = itemData.value;
                    data.memory.preferences[existing].confidence = Math.min(1, data.memory.preferences[existing].confidence + 0.1);
                    data.memory.preferences[existing].learnedAt = now;
                } else {
                    data.memory.preferences.push({
                        id,
                        category: itemData.category || 'workflow',
                        key: itemData.key,
                        value: itemData.value,
                        confidence: itemData.confidence || 0.7,
                        learnedAt: now,
                        corrections: 0
                    });
                }
                break;
            }
            default:
                return Response.json({ error: 'Invalid type. Use: fact, entity, preference' }, { status: 400 });
        }

        await writeData(data);
        return Response.json({ success: true, id, type });
    } catch (error) {
        console.error('Memory POST error:', error);
        return Response.json({ error: 'Failed to store memory' }, { status: 500 });
    }
}
