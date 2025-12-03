// server/services/emailService.ts
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Email transporter configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to Career Portal',
    template: 'welcome.html'
  },
  applicationSubmitted: {
    subject: 'Application Submitted Successfully',
    template: 'application-submitted.html'
  },
  applicationStatusChanged: {
    subject: 'Application Status Update',
    template: 'application-status-changed.html'
  },
  newApplication: {
    subject: 'New Application Received',
    template: 'new-application.html'
  },
  interviewScheduled: {
    subject: 'Interview Scheduled',
    template: 'interview-scheduled.html'
  },
  jobPosted: {
    subject: 'New Job Posted',
    template: 'job-posted.html'
  },
  passwordReset: {
    subject: 'Password Reset Request',
    template: 'password-reset.html'
  }
};

// Email service class
export class EmailService {
  
  static async sendEmail(to: string, subject: string, html: string, attachments: any[] = []) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        to,
        subject,
        html,
        attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  }

  static async sendTemplatedEmail(to: string, templateName: string, data: any) {
    try {
      const template = templates[templateName as keyof typeof templates];
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const html = await this.renderTemplate(template.template, data);
      return await this.sendEmail(to, template.subject, html);
    } catch (error) {
      console.error('Templated email sending failed:', error);
      return { success: false, error };
    }
  }

  static async renderTemplate(templateName: string, data: any): Promise<string> {
    try {
      const templatePath = path.join(process.cwd(), 'server', 'templates', 'email', templateName);
      
      if (!fs.existsSync(templatePath)) {
        // Return a basic HTML template if file doesn't exist
        return this.generateBasicTemplate(data, templateName);
      }

      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Replace template variables
      template = template.replace(/\{\{(\s*\w+\s*)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return data[trimmedKey] || match;
      });

      return template;
    } catch (error) {
      console.error('Template rendering failed:', error);
      return this.generateBasicTemplate(data, templateName);
    }
  }

  static generateBasicTemplate(data: any, templateName: string): string {
    const companyName = process.env.APP_NAME || 'Career Portal';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const templates: { [key: string]: string } = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${companyName}!</h2>
          <p>Hi {{name}},</p>
          <p>Welcome to ${companyName}! Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse job opportunities</li>
            <li>Apply to positions</li>
            <li>Manage your profile</li>
          </ul>
          <p>
            <a href="${appUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Get Started
            </a>
          </p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `,
      'application-submitted': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Submitted Successfully!</h2>
          <p>Hi {{candidateName}},</p>
          <p>Your application for <strong>{{jobTitle}}</strong> has been successfully submitted.</p>
          <p><strong>Application Details:</strong></p>
          <ul>
            <li>Job: {{jobTitle}}</li>
            <li>Company: {{companyName}}</li>
            <li>Applied on: {{applicationDate}}</li>
          </ul>
          <p>We'll review your application and get back to you soon.</p>
          <p>
            <a href="${appUrl}/applications" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Application Status
            </a>
          </p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `,
      'application-status-changed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Status Update</h2>
          <p>Hi {{candidateName}},</p>
          <p>The status of your application for <strong>{{jobTitle}}</strong> has been updated.</p>
          <p><strong>New Status:</strong> <span style="color: #3B82F6; font-weight: bold;">{{newStatus}}</span></p>
          <p>{{statusMessage}}</p>
          <p>
            <a href="${appUrl}/applications/{{applicationId}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Application
            </a>
          </p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `,
      'new-application': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Application Received!</h2>
          <p>Hi {{hiringManagerName}},</p>
          <p>You have received a new application for your job posting <strong>{{jobTitle}}</strong>.</p>
          <p><strong>Candidate Details:</strong></p>
          <ul>
            <li>Name: {{candidateName}}</li>
            <li>Email: {{candidateEmail}}</li>
            <li>Applied on: {{applicationDate}}</li>
          </ul>
          <p>
            <a href="${appUrl}/admin/applications/{{applicationId}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Application
            </a>
          </p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `
    };

    const template = templates[templateName] || templates.welcome;
    
    // Replace template variables
    return template.replace(/\{\{(\s*\w+\s*)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] || match;
    });
  }

  // Specific email methods

  static async sendWelcomeEmail(to: string, name: string) {
    return await this.sendTemplatedEmail(to, 'welcome', { name });
  }

  static async sendApplicationSubmittedEmail(to: string, data: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    applicationDate: string;
    applicationId: string;
  }) {
    return await this.sendTemplatedEmail(to, 'application-submitted', data);
  }

  static async sendApplicationStatusChangedEmail(to: string, data: {
    candidateName: string;
    jobTitle: string;
    newStatus: string;
    oldStatus: string;
    statusMessage: string;
    applicationId: string;
  }) {
    return await this.sendTemplatedEmail(to, 'application-status-changed', data);
  }

  static async sendNewApplicationEmail(to: string, data: {
    hiringManagerName: string;
    jobTitle: string;
    candidateName: string;
    candidateEmail: string;
    applicationDate: string;
    applicationId: string;
  }) {
    return await this.sendTemplatedEmail(to, 'new-application', data);
  }

  static async sendInterviewScheduledEmail(to: string, data: {
    candidateName: string;
    jobTitle: string;
    interviewDate: string;
    interviewTime: string;
    interviewType: string;
    interviewLocation: string;
    interviewerName: string;
  }) {
    return await this.sendTemplatedEmail(to, 'interview-scheduled', data);
  }

  static async sendJobPostedEmail(to: string, data: {
    jobTitle: string;
    department: string;
    location: string;
    jobUrl: string;
  }) {
    return await this.sendTemplatedEmail(to, 'job-posted', data);
  }

  static async sendPasswordResetEmail(to: string, data: {
    name: string;
    resetToken: string;
    resetUrl: string;
  }) {
    return await this.sendTemplatedEmail(to, 'password-reset', data);
  }

  // Missing methods that are being called in other services
  static async sendApplicationStatusUpdate(to: string, data: {
    candidateName: string;
    jobTitle: string;
    newStatus: string;
    statusMessage: string;
    applicationId: string;
  }) {
    return await this.sendTemplatedEmail(to, 'application-status-changed', data);
  }

  static async sendInterviewInvitation(to: string, data: {
    candidateName: string;
    jobTitle: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewType: string;
    interviewLocation: string;
    interviewerName: string;
    scheduledDate?: Date;
    location?: string;
    meetingLink?: string;
    interviewId?: number;
  }) {
    return await this.sendTemplatedEmail(to, 'interview-scheduled', data);
  }

  static async sendJobOffer(to: string, data: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    offerDetails: string;
    salary?: number;
    startDate?: Date;
    benefits?: string;
    conditions?: string;
  }) {
    const subject = `Job Offer: ${data.jobTitle} at ${data.companyName}`;
    let offerDetails = data.offerDetails;
    
    // If no offerDetails provided, create from other fields
    if (!offerDetails && data.salary) {
      offerDetails = `
        <p><strong>Salary:</strong> $${data.salary.toLocaleString()}</p>
        ${data.startDate ? `<p><strong>Start Date:</strong> ${data.startDate.toLocaleDateString()}</p>` : ''}
        ${data.benefits ? `<p><strong>Benefits:</strong> ${data.benefits}</p>` : ''}
        ${data.conditions ? `<p><strong>Conditions:</strong> ${data.conditions}</p>` : ''}
      `;
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations! Job Offer</h2>
        <p>Dear ${data.candidateName},</p>
        <p>We are pleased to offer you the position of <strong>${data.jobTitle}</strong> at ${data.companyName}.</p>
        ${offerDetails}
        <p>Please review the offer details and respond at your earliest convenience.</p>
        <p>Best regards,<br>The ${data.companyName} Team</p>
      </div>
    `;
    return await this.sendEmail(to, subject, html);
  }

  static async sendAssessmentResult(to: string, data: {
    candidateName: string;
    assessmentType: string;
    score: number;
    result: string;
    nextSteps: string;
  }) {
    const subject = `Assessment Results: ${data.assessmentType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Assessment Results</h2>
        <p>Dear ${data.candidateName},</p>
        <p>Your assessment for <strong>${data.assessmentType}</strong> has been completed.</p>
        <p><strong>Score:</strong> ${data.score}%</p>
        <p><strong>Result:</strong> ${data.result}</p>
        <p>${data.nextSteps}</p>
        <p>Best regards,<br>The Hiring Team</p>
      </div>
    `;
    return await this.sendEmail(to, subject, html);
  }

  // Bulk email methods

  static async sendBulkEmails(recipients: string[], subject: string, html: string) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, html);
        results.push({ recipient, success: result.success, error: result.error });
      } catch (error) {
        results.push({ recipient, success: false, error });
      }
    }

    return results;
  }

  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Email queue for bulk sending
  static async queueEmail(to: string, subject: string, html: string, delay: number = 0) {
    // This would typically integrate with a queue system like Bull
    // For now, just send immediately
    if (delay > 0) {
      setTimeout(() => {
        this.sendEmail(to, subject, html);
      }, delay);
    } else {
      return await this.sendEmail(to, subject, html);
    }
  }
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Email queue interface
interface EmailQueueItem {
  to: string;
  subject: string;
  html: string;
  scheduledFor: Date;
  sent: boolean;
  attempts: number;
}

// Export types
export type { EmailTemplate, EmailQueueItem };
