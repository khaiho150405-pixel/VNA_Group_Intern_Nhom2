import { Logger } from '@nestjs/common';
import * as smtpapi from 'smtpapi';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export default class Email {
  static sendMail = async (email: string, subject: string, data_html: string, data_text: string = '') => {
    const EMAIL_SENDGRID_KEY = process.env.SENDGRID_KEY || '';

    const attachments = [];
    // Check if the logo image exists in the templates folder to attach it as inline CID
    const logoPath = path.resolve(process.cwd(), 'src/commons/templates/logo.png');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo.png', // matches <img src="cid:logo.png" />
        contentDisposition: 'inline'
      });
    }

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'info@rcp.com.vn',
      subject: subject,
      text: data_text,
      html: data_html,
      attachments
    }

    return new Promise((resolve, reject) => {
      const header = new smtpapi();
      const headers = {
        'x-smtpapi': header.jsonString()
      };
      const settings = {
        host: process.env.MAIL_HOST || 'smtp.sendgrid.net',
        port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
        requiresAuth: true,
        auth: {
          user: process.env.MAIL_USER || 'apikey',
          pass: process.env.MAIL_PASS || EMAIL_SENDGRID_KEY,
        },
        secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
      };
      const smtpTransport = nodemailer.createTransport(settings);
      const mailOptionsNew = { ...msg, headers };
      smtpTransport.sendMail(mailOptionsNew, (error, response) => {
        smtpTransport.close();
        if (error) {
          Logger.error(error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
