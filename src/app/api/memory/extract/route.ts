import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const EXTRACTION_PROMPT = `You are a knowledge extraction engine. Analyze the conversation below and extract:
1. FACTS: Things stated as true (entity + predicate + object). Example: {"entity":"Younes","predicate":"works_on","object":"Dashboard YOYO"}
2. PREFERENCES: User communication or workflow preferences. Example: {"category":"communication","key":"emoji_usage","value":"frequent"}
3. ENTITIES: People, projects, tools, companies mentioned. Example: {"type":"project","name":"Dashboard YOYO","description":"AI command center"}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"facts":[],"preferences":[],"entities":[]}

If nothing new to extract, return: {"facts":[],"preferences":[],"entities":[]}`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return Response.json({ extracted: false, reason: 'No messages provided' });
        }

        if (!OPENROUTER_API_KEY) {
            return Response.json({ extracted: false, reason: 'API key not configured' });
        }

        // Format messages for extraction
        const conversationText = messages.map((m: any) => {
            const sender = m.sender || m.role || 'unknown';
            const text = m.text || m.content || '';
            return `${sender}: ${text}`;
        }).join('\n');

        // Call OpenRouter for extraction
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dashboardyoyo.com',
                'X-Title': 'Dashboard YOYO Memory',
            },
            body: JSON.stringify({
                model: 'moonshotai/kimi-k2',
                messages: [
                    { role: 'system', content: EXTRACTION_PROMPT },
                    { role: 'user', content: `Extract knowledge from this conversation:\n\n${conversationText}` }
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
        });

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '{}';

        // Parse extraction result
        let extracted;
        try {
            // Clean potential markdown wrapping
            const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            extracted = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Failed to parse extraction:', content);
            return Response.json({ extracted: false, reason: 'Parse error' });
        }

        // Merge extracted data into memory
        const data = await readData();
        if (!data.memory) {
            data.memory = { facts: [], entities: [], preferences: [], relationships: [] };
        }

        const now = new Date().toISOString();
        let addedFacts = 0;
        let addedPrefs = 0;
        let addedEntities = 0;

        // Add facts (deduplicate by entity+predicate)
        if (extracted.facts && Array.isArray(extracted.facts)) {
            for (const fact of extracted.facts) {
                if (!fact.entity || !fact.predicate || !fact.object) continue;
                const exists = data.memory.facts.some((f: any) =>
                    f.entity === fact.entity && f.predicate === fact.predicate && f.object === fact.object
                );
                if (!exists) {
                    data.memory.facts.push({
                        id: `fact-${Date.now()}-${addedFacts}`,
                        entity: fact.entity,
                        predicate: fact.predicate,
                        object: fact.object,
                        source: 'extraction',
                        confidence: 0.7,
                        extractedAt: now,
                        lastMentioned: now
                    });
                    addedFacts++;
                }
            }
        }

        // Add preferences (update existing or add new)
        if (extracted.preferences && Array.isArray(extracted.preferences)) {
            for (const pref of extracted.preferences) {
                if (!pref.key || !pref.value) continue;
                const existingIdx = data.memory.preferences.findIndex((p: any) => p.key === pref.key);
                if (existingIdx >= 0) {
                    data.memory.preferences[existingIdx].value = pref.value;
                    data.memory.preferences[existingIdx].confidence = Math.min(1, data.memory.preferences[existingIdx].confidence + 0.1);
                } else {
                    data.memory.preferences.push({
                        id: `pref-${Date.now()}-${addedPrefs}`,
                        category: pref.category || 'workflow',
                        key: pref.key,
                        value: pref.value,
                        confidence: 0.6,
                        learnedAt: now,
                        corrections: 0
                    });
                    addedPrefs++;
                }
            }
        }

        // Add entities (deduplicate by name)
        if (extracted.entities && Array.isArray(extracted.entities)) {
            for (const entity of extracted.entities) {
                if (!entity.name) continue;
                const exists = data.memory.entities.some((e: any) =>
                    e.name.toLowerCase() === entity.name.toLowerCase()
                );
                if (!exists) {
                    data.memory.entities.push({
                        id: `entity-${Date.now()}-${addedEntities}`,
                        type: entity.type || 'concept',
                        name: entity.name,
                        description: entity.description || '',
                        properties: entity.properties || {},
                        mentionCount: 1,
                        lastMentioned: now
                    });
                    addedEntities++;
                } else {
                    // Update mention count
                    const idx = data.memory.entities.findIndex((e: any) =>
                        e.name.toLowerCase() === entity.name.toLowerCase()
                    );
                    if (idx >= 0) {
                        data.memory.entities[idx].mentionCount += 1;
                        data.memory.entities[idx].lastMentioned = now;
                    }
                }
            }
        }

        if (addedFacts + addedPrefs + addedEntities > 0) {
            await writeData(data);
        }

        return Response.json({
            extracted: true,
            added: { facts: addedFacts, preferences: addedPrefs, entities: addedEntities }
        });
    } catch (error) {
        console.error('Memory extract error:', error);
        return Response.json({ extracted: false, reason: 'Internal error' }, { status: 500 });
    }
}
