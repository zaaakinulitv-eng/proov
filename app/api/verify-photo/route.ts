import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { photoUrl, scoreUs, scoreThem, opponentTeam } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: photoUrl }
          },
          {
            type: 'text',
            text: `Это фото результата футбольного матча.
Игрок заявил счёт: ${scoreUs}:${scoreThem} против команды ${opponentTeam}.

Ответь ТОЛЬКО в формате JSON:
{
  "is_valid": true/false,
  "confidence": 0-100,
  "reason": "краткое объяснение",
  "auto_approve": true/false
}

auto_approve = true ТОЛЬКО если:
- Фото явно показывает результат матча (табло, протокол, скрин)
- Счёт на фото совпадает с заявленным ${scoreUs}:${scoreThem}
- confidence выше 80

Если фото нечёткое или счёт не виден — auto_approve = false.`
          }
        ]
      }
    ],
    max_tokens: 200
  })

  const content = response.choices[0].message.content || '{}'
  const clean = content.replace(/```json|```/g, '').trim()

  try {
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ is_valid: false, confidence: 0, auto_approve: false, reason: 'Ошибка анализа' })
  }
}