import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSessionUser } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const userId = await getSessionUser();
    
    // Fetch username to include in email if logged in
    let username = 'Anonymous';
    if (userId) {
      const { data } = await supabase.from('users').select('username').eq('id', userId).single();
      if (data) username = data.username;
    }

    const formData = await request.formData();
    const category = formData.get('category');
    const message = formData.get('message');
    const screenshot = formData.get('screenshot'); // File object

    if (!category || !message) {
      return NextResponse.json({ error: 'Category and message are required' }, { status: 400 });
    }

    const attachments = [];

    if (screenshot && screenshot.size > 0) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes = 5242880 bytes)
      if (screenshot.size > 5242880) {
        return NextResponse.json({ error: 'Screenshot must be under 5MB' }, { status: 400 });
      }

      // Validate file type
      if (!screenshot.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }

      const buffer = Buffer.from(await screenshot.arrayBuffer());
      attachments.push({
        filename: screenshot.name,
        content: buffer
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured on the server.');
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'elepanogabriel2004@gmail.com',
      subject: `[GC Tracker Feedback] - ${category}`,
      text: `Feedback submitted by: ${username} (ID: ${userId || 'Unauthenticated'})\n\nCategory: ${category}\n\nMessage:\n${message}`,
      attachments
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send feedback' }, { status: 500 });
  }
}
