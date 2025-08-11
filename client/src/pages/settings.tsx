import { useState } from "react";
import { Save, Database, Bell, Shield, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Customer Manager",
    companyPhone: "",
    companyAddress: "",
    
    // Firebase Configuration
    firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // UI Settings
    theme: "light",
    language: "en",
    dateFormat: "dd/mm/yyyy",
    currency: "MAD",
    
    // Security Settings
    autoLogout: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    retentionDays: 30,
  });

  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, this would save to backend/database
    localStorage.setItem("customerManagerSettings", JSON.stringify(settings));
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const handleReset = () => {
    // Reset to defaults
    localStorage.removeItem("customerManagerSettings");
    window.location.reload();
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic company and application information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) => updateSetting("companyName", e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label htmlFor="company-phone">Company Phone</Label>
              <Input
                id="company-phone"
                value={settings.companyPhone}
                onChange={(e) => updateSetting("companyPhone", e.target.value)}
                placeholder="Company phone number"
              />
            </div>
            <div>
              <Label htmlFor="company-address">Company Address</Label>
              <Input
                id="company-address"
                value={settings.companyAddress}
                onChange={(e) => updateSetting("companyAddress", e.target.value)}
                placeholder="Company address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAD">MAD (Dirham)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Firebase Configuration
            </CardTitle>
            <CardDescription>
              Database and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="firebase-project-id">Project ID</Label>
              <Input
                id="firebase-project-id"
                value={settings.firebaseProjectId}
                onChange={(e) => updateSetting("firebaseProjectId", e.target.value)}
                placeholder="your-firebase-project-id"
              />
            </div>
            <div>
              <Label htmlFor="firebase-api-key">API Key</Label>
              <Input
                id="firebase-api-key"
                type="password"
                value={settings.firebaseApiKey}
                onChange={(e) => updateSetting("firebaseApiKey", e.target.value)}
                placeholder="Your Firebase API key"
              />
            </div>
            <div>
              <Label htmlFor="firebase-app-id">App ID</Label>
              <Input
                id="firebase-app-id"
                value={settings.firebaseAppId}
                onChange={(e) => updateSetting("firebaseAppId", e.target.value)}
                placeholder="Your Firebase App ID"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <strong>Note:</strong> Firebase credentials are loaded from environment variables. 
              Changes here won't persist unless updated in your deployment settings.
            </div>
          </CardContent>
        </Card>

        {/* UI & Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              UI & Display
            </CardTitle>
            <CardDescription>
              Customize the appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => updateSetting("dateFormat", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive SMS alerts</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-500">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Logout</Label>
                <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
              </div>
              <Switch
                checked={settings.autoLogout}
                onCheckedChange={(checked) => updateSetting("autoLogout", checked)}
              />
            </div>
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value))}
                min="15"
                max="480"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add extra security to your account</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup & Recovery
            </CardTitle>
            <CardDescription>
              Data backup and recovery options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-gray-500">Automatically backup your data</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
              />
            </div>
            <div>
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select value={settings.backupFrequency} onValueChange={(value) => updateSetting("backupFrequency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retention-days">Retention Days</Label>
              <Input
                id="retention-days"
                type="number"
                value={settings.retentionDays}
                onChange={(e) => updateSetting("retentionDays", parseInt(e.target.value))}
                min="7"
                max="365"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}