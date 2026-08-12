import { ArrowLeft, Shield, Eye, Database, Lock, Mail } from 'lucide-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10" />
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-white/80 mt-2">Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-primary" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Microstock Image Metadata Generator. We respect your privacy and are committed 
                to protecting your personal data. This privacy policy explains how we handle your information 
                when you use our AI-powered metadata generation service.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-primary" />
                Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Images You Upload</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When you upload images for metadata generation, they are processed temporarily 
                  through Google's Gemini AI API. We do not store your images on our servers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">API Keys</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your Google Gemini API key is stored locally in your browser's localStorage. 
                  It is never transmitted to our servers and remains entirely under your control.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Generated Metadata</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The titles, descriptions, and keywords generated are displayed in your browser 
                  and are not stored on our servers. You can export this data as CSV files for your use.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-primary" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
                <li>All data transmission is encrypted using HTTPS</li>
                <li>API keys are stored locally and never leave your device</li>
                <li>Images are processed in-memory and not persisted</li>
                <li>No user accounts or personal information is collected</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Our service uses the following third-party services:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Google Gemini AI</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We use Google's Gemini AI API to analyze your images and generate metadata. 
                  Your images are sent to Google's servers for processing. Please refer to 
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline ml-1"
                  >
                    Google's Privacy Policy
                  </a> for more information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
                <li>Clear your API key from localStorage at any time through your browser settings</li>
                <li>Choose not to upload images or use our service</li>
                <li>Export or delete any generated metadata</li>
                <li>Contact us with any privacy concerns</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please 
                <Link to="/contact" className="text-brand-primary hover:underline ml-1">
                  contact us
                </Link>.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Microstock Metadata Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}


export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy | Microstock Metadata Generator' },
      { name: 'description', content: 'How your images, API keys and data are handled by the Microstock Image Metadata Generator.' },
      { property: 'og:title', content: 'Privacy Policy | Microstock Metadata Generator' },
      { property: 'og:description', content: 'How your images, API keys and data are handled by the Microstock Image Metadata Generator.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PrivacyPolicy,
});
