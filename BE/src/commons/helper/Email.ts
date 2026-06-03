import { Logger } from '@nestjs/common';
import * as smtpapi from 'smtpapi';
import * as nodemailer from 'nodemailer';

export default class Email {
  static sendMail = async (email: string, subject: string, data_html: string, data_text: string = '') => {
    const EMAIL_SENDGRID_KEY = process.env.SENDGRID_KEY || '';
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'info@rcp.com.vn',
      subject: subject,
      text: data_text,
      html: data_html,
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
