import { useState, useEffect } from "react";
import { Save, Database, Bell, Shield, Palette, Globe, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings from Firebase
  const { data: savedSettings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/settings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Test Firebase connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest("/api/settings/test-connection", "POST", {}),
    onSuccess: (data: any) => {
      setConnectionStatus(data.success ? "success" : "error");
      setConnectionMessage(data.message);
    },
    onError: () => {
      setConnectionStatus("error");
      setConnectionMessage("Connection test failed");
    },
  });

  // Load saved settings when data is available
  useEffect(() => {
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...savedSettings }));
    }
  }, [savedSettings]);

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleTestConnection = () => {
    setConnectionStatus("testing");
    setConnectionMessage("");
    testConnectionMutation.mutate();
  };

  const handleReset = () => {
    // Reset to defaults and clear from database
    const defaultSettings = {
      companyName: "Customer Manager",
      companyPhone: "",
      companyAddress: "",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      theme: "light",
      language: "en",
      dateFormat: "dd/mm/yyyy",
      currency: "MAD",
      autoLogout: true,
      sessionTimeout: 60,
      twoFactorAuth: false,
      autoBackup: true,
      backupFrequency: "daily",
      retentionDays: 30,
    };
    setSettings(prev => ({ ...prev, ...defaultSettings }));
    saveSettingsMutation.mutate(defaultSettings);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>;
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-700">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Connection Failed</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
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
              Firebase Database
            </CardTitle>
            <CardDescription>
              Firebase project configuration and connection status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getConnectionStatusIcon()}
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              {getConnectionStatusBadge()}
            </div>
            
            {connectionMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                connectionStatus === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : connectionStatus === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {connectionMessage}
              </div>
            )}

            <div>
              <Label htmlFor="firebase-api-key">API Key</Label>
              <Input
                id="firebase-api-key"
                type="password"
                value={settings.firebaseApiKey}
                onChange={(e) => updateSetting("firebaseApiKey", e.target.value)}
                placeholder="Firebase API Key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Environment: {import.meta.env.VITE_FIREBASE_API_KEY ? "Configured" : "Not Set"}
              </p>
            </div>
            <div>
              <Label htmlFor="firebase-project-id">Project ID</Label>
              <Input
                id="firebase-project-id"
                value={settings.firebaseProjectId}
                onChange={(e) => updateSetting("firebaseProjectId", e.target.value)}
                placeholder="Firebase Project ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Environment: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Configured" : "Not Set"}
              </p>
            </div>
            <div>
              <Label htmlFor="firebase-app-id">App ID</Label>
              <Input
                id="firebase-app-id"
                value={settings.firebaseAppId}
                onChange={(e) => updateSetting("firebaseAppId", e.target.value)}
                placeholder="Firebase App ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Environment: {import.meta.env.VITE_FIREBASE_APP_ID ? "Configured" : "Not Set"}
              </p>
            </div>
            
            <Button 
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending || connectionStatus === "testing"}
              className="w-full"
              variant="outline"
            >
              {testConnectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Test Firebase Connection
                </>
              )}
            </Button>
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