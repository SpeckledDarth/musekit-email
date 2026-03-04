import React, { useState, useCallback, useMemo } from 'react';
import { getAvailableVariables, replaceVariables, validateTemplate } from './variables';
import type { TemplateType } from './variables';
import { emailWrapper } from './templates/shared';

interface EmailTemplateEditorProps {
  initialTemplate?: string;
  templateType?: TemplateType;
  onSave?: (template: string) => void;
  onSendTest?: (html: string, toEmail: string) => void;
  brandSettings?: {
    appName?: string;
    primaryColor?: string;
    supportEmail?: string;
    websiteUrl?: string;
  };
}

export function EmailTemplateEditor({
  initialTemplate = '',
  templateType = 'welcome',
  onSave,
  onSendTest,
  brandSettings,
}: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [selectedType, setSelectedType] = useState<TemplateType>(templateType);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const variables = useMemo(() => getAvailableVariables(selectedType), [selectedType]);

  const sampleValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const v of variables) {
      values[v.name] = v.defaultValue || `[${v.name}]`;
    }
    return values;
  }, [variables]);

  const previewHtml = useMemo(() => {
    const replaced = replaceVariables(template, sampleValues);
    const brand = {
      appName: brandSettings?.appName || 'MuseKit',
      primaryColor: brandSettings?.primaryColor || '#3b6cff',
      supportEmail: brandSettings?.supportEmail || 'support@musekit.app',
      websiteUrl: brandSettings?.websiteUrl || 'https://musekit.app',
    };
    return emailWrapper(replaced, brand);
  }, [template, sampleValues, brandSettings]);

  const validation = useMemo(
    () => validateTemplate(template, selectedType, sampleValues),
    [template, selectedType, sampleValues]
  );

  const insertVariable = useCallback((varName: string) => {
    setTemplate((prev) => prev + `{{${varName}}}`);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(template);
      setSaveMessage('Template saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [template, onSave]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail || !onSendTest) return;
    setTestSending(true);
    try {
      await onSendTest(previewHtml, testEmail);
      setSaveMessage('Test email sent!');
    } catch {
      setSaveMessage('Failed to send test email');
    }
    setTestSending(false);
    setTimeout(() => setSaveMessage(''), 3000);
  }, [testEmail, onSendTest, previewHtml]);

  const templateTypes: TemplateType[] = [
    'welcome',
    'verification',
    'password-reset',
    'subscription-confirm',
    'subscription-canceled',
    'team-invitation',
    'kpi-report',
  ];

  return (
    <div className="email-editor flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="editor-toolbar flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <label className="text-sm font-medium text-gray-700">Template Type:</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as TemplateType)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {templateTypes.map((t) => (
            <option key={t} value={t}>
              {t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {saveMessage && (
            <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Template
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="editor-panel w-1/2 flex flex-col border-r border-gray-200">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Insert Variables</h3>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v.name}
                  onClick={() => insertVariable(v.name)}
                  title={v.description}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    v.required
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {`{{${v.name}}}`}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder="Enter your email template HTML here... Use {{variableName}} for dynamic content."
          />

          {!validation.valid && (
            <div className="p-3 bg-yellow-50 border-t border-yellow-200">
              <p className="text-xs font-medium text-yellow-800">
                Missing required variables: {validation.missingVariables.join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="preview-panel w-1/2 flex flex-col">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
            {onSendTest && (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md w-40 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendTest}
                  disabled={testSending || !testEmail}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {testSending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <iframe
              srcDoc={previewHtml}
              title="Email Preview"
              className="w-full h-full border-0 bg-white rounded shadow-sm"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
