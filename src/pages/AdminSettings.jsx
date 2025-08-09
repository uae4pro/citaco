import React, { useState, useEffect, useCallback } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    store_name: '',
    currency: '',
    shipping_cost: '',
    business_email: ''
  });
  const [settingsId, setSettingsId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsObj = await supabaseHelpers.settings.getAll();

      // Set settings with defaults if not found
      setSettings({
        store_name: settingsObj.store_name || 'CITACO',
        currency: settingsObj.currency || 'AED',
        shipping_cost: settingsObj.shipping_cost || '25',
        business_email: settingsObj.business_email || ''
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Could not load site settings.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabaseHelpers.settings.updateMultiple(settings);
      toast({
        title: "Success",
        description: "Settings saved successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Could not save settings.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Site Settings</h1>
            <p className="text-slate-600 mt-2">Manage general site configuration.</p>
          </div>
          
          <Card className="max-w-2xl mx-auto shadow-lg">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update your site's public name and subtitle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input
                    id="store_name"
                    name="store_name"
                    value={settings.store_name || ''}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="CITACO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={settings.currency || ''}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="AED"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping_cost">Shipping Cost</Label>
                  <Input
                    id="shipping_cost"
                    name="shipping_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.shipping_cost || ''}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    name="business_email"
                    type="email"
                    value={settings.business_email || ''}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="contact@autoparts.com"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving || isLoading}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}