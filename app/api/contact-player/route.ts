import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { player_id, scout_name, scout_email, message } = await request.json()

    // Validate required fields
    if (!player_id || !scout_name || !scout_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (message.length < 50) {
      return NextResponse.json({ error: 'Message must be at least 50 characters' }, { status: 400 })
    }

    // Get player profile
    const { data: player, error: playerError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Save to scout_contacts table
    const { error: insertError } = await supabase
      .from('scout_contacts')
      .insert({
        player_id,
        scout_name,
        scout_email,
        message,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
    }

    await supabase.from('notifications').insert({
      player_id,
      type: 'scout_contact',
      title: 'Скаут хочет связаться 👀',
      message: `${scout_name} заинтересован твоим профилем`
    })

    // Send email to player
    const playerEmailHtml = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #080808; color: white; padding: 40px;">
        <h1 style="color: #AAFF00; font-size: 24px; margin-bottom: 20px;">Скаут хочет с тобой связаться — Proov</h1>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Привет <strong>${player.full_name}</strong>!
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          <strong>${scout_name}</strong> заинтересован твоим профилем.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Их email: <a href="mailto:${scout_email}" style="color: #AAFF00;">${scout_email}</a>
        </p>

        <div style="background: #161616; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #222;">
          <h3 style="color: #AAFF00; margin-bottom: 10px;">Сообщение:</h3>
          <p style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/player/${player_id}"
             style="background: #AAFF00; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Открыть профиль
          </a>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'Proov <noreply@proov.app>',
      to: player.email,
      subject: 'Скаут хочет с тобой связаться — Proov',
      html: playerEmailHtml,
    })

    // Send confirmation to scout
    const scoutEmailHtml = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #080808; color: white; padding: 40px;">
        <h1 style="color: #AAFF00; font-size: 24px; margin-bottom: 20px;">✓ Сообщение отправлено!</h1>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Твоё сообщение игроку <strong>${player.full_name}</strong> успешно отправлено.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Игрок получит уведомление на email и сможет с тобой связаться.
        </p>

        <div style="background: #161616; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #222;">
          <h3 style="color: #AAFF00; margin-bottom: 10px;">Твоё сообщение:</h3>
          <p style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="font-size: 14px; color: #888888;">
          Если у тебя есть вопросы, пиши на support@proov.app
        </p>
      </div>
    `

    await resend.emails.send({
      from: 'Proov <noreply@proov.app>',
      to: scout_email,
      subject: '✓ Сообщение игроку отправлено — Proov',
      html: scoutEmailHtml,
    })

    // Send copy to admin
    const adminEmailHtml = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #080808; color: white; padding: 40px;">
        <h1 style="color: #AAFF00; font-size: 24px; margin-bottom: 20px;">Новый контакт от скаута</h1>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Скаут <strong>${scout_name}</strong> (${scout_email}) связался с игроком <strong>${player.full_name}</strong>.
        </p>

        <div style="background: #161616; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #222;">
          <h3 style="color: #AAFF00; margin-bottom: 10px;">Сообщение:</h3>
          <p style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/player/${player_id}"
             style="background: #AAFF00; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Посмотреть профиль игрока
          </a>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'Proov <noreply@proov.app>',
      to: process.env.ADMIN_EMAIL!,
      subject: 'Новый контакт от скаута — Proov',
      html: adminEmailHtml,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Contact player error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}