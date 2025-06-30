'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin, Clock, DollarSign, Settings, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DeliveryTier {
  id: number;
  name: string;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  color: string;
}

interface LocationRule {
  id: string;
  type: 'district' | 'city' | 'pincode';
  value: string;
  tier: number;
  isActive: boolean;
}

interface DeliverySettings {
  enableWeekendAdjustment: boolean;
  weekendExtraDays: number;
  enableHolidayAdjustment: boolean;
  holidayExtraDays: number;
  defaultTier: number;
  restrictToState: string;
  freeDeliveryThreshold: number;
  enableExpressDelivery: boolean;
  expressDeliveryFee: number;
  enableCOD: boolean;
  codFee: number;
  maxCodAmount: number;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  isActive: boolean;
}

export default function DeliverySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tiers');
  
  // Delivery Tiers
  const [deliveryTiers, setDeliveryTiers] = useState<DeliveryTier[]>([
    { id: 1, name: 'Express', minDays: 2, maxDays: 3, isActive: true, color: 'green' },
    { id: 2, name: 'Standard', minDays: 3, maxDays: 4, isActive: true, color: 'blue' },
    { id: 3, name: 'Economy', minDays: 4, maxDays: 6, isActive: true, color: 'orange' }
  ]);

  // Location Rules
  const [locationRules, setLocationRules] = useState<LocationRule[]>([
    { id: '1', type: 'district', value: 'howrah', tier: 1, isActive: true },
    { id: '2', type: 'district', value: 'kolkata', tier: 1, isActive: true },
    { id: '3', type: 'district', value: 'hooghly', tier: 1, isActive: true },
    { id: '4', type: 'district', value: 'north 24 parganas', tier: 1, isActive: true },
    { id: '5', type: 'city', value: 'durgapur', tier: 2, isActive: true },
    { id: '6', type: 'city', value: 'asansol', tier: 2, isActive: true },
    { id: '7', type: 'city', value: 'bardhaman', tier: 2, isActive: true },
    { id: '8', type: 'city', value: 'kharagpur', tier: 2, isActive: true },
  ]);

  // General Settings
  const [settings, setSettings] = useState<DeliverySettings>({
    enableWeekendAdjustment: true,
    weekendExtraDays: 2,
    enableHolidayAdjustment: true,
    holidayExtraDays: 1,
    defaultTier: 3,
    restrictToState: 'West Bengal',
    freeDeliveryThreshold: 50,
    enableExpressDelivery: true,
    expressDeliveryFee: 15,
    enableCOD: true,
    codFee: 5,
    maxCodAmount: 1000
  });

  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: '1', name: 'Diwali', date: '2024-11-01', isActive: true },
    { id: '2', name: 'Christmas', date: '2024-12-25', isActive: true },
    { id: '3', name: 'New Year', date: '2025-01-01', isActive: true },
  ]);

  // New item states
  const [newTier, setNewTier] = useState<Partial<DeliveryTier>>({});
  const [newRule, setNewRule] = useState<Partial<LocationRule>>({});
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({});

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would save to your backend/database
      console.log('Saving delivery settings:', {
        tiers: deliveryTiers,
        rules: locationRules,
        settings,
        holidays
      });
      
      toast.success('Delivery settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addDeliveryTier = () => {
    if (!newTier.name || !newTier.minDays || !newTier.maxDays) {
      toast.error('Please fill in all tier fields');
      return;
    }

    const tier: DeliveryTier = {
      id: Math.max(...deliveryTiers.map(t => t.id)) + 1,
      name: newTier.name,
      minDays: newTier.minDays,
      maxDays: newTier.maxDays,
      isActive: true,
      color: newTier.color || 'gray'
    };

    setDeliveryTiers([...deliveryTiers, tier]);
    setNewTier({});
    toast.success('Delivery tier added successfully');
  };

  const updateDeliveryTier = (id: number, updates: Partial<DeliveryTier>) => {
    setDeliveryTiers(tiers => 
      tiers.map(tier => tier.id === id ? { ...tier, ...updates } : tier)
    );
  };

  const deleteDeliveryTier = (id: number) => {
    if (deliveryTiers.length <= 1) {
      toast.error('Cannot delete the last delivery tier');
      return;
    }
    setDeliveryTiers(tiers => tiers.filter(tier => tier.id !== id));
    toast.success('Delivery tier deleted');
  };

  const addLocationRule = () => {
    if (!newRule.type || !newRule.value || !newRule.tier) {
      toast.error('Please fill in all rule fields');
      return;
    }

    const rule: LocationRule = {
      id: Date.now().toString(),
      type: newRule.type as 'district' | 'city' | 'pincode',
      value: newRule.value.toLowerCase(),
      tier: newRule.tier,
      isActive: true
    };

    setLocationRules([...locationRules, rule]);
    setNewRule({});
    toast.success('Location rule added successfully');
  };

  const updateLocationRule = (id: string, updates: Partial<LocationRule>) => {
    setLocationRules(rules => 
      rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    );
  };

  const deleteLocationRule = (id: string) => {
    setLocationRules(rules => rules.filter(rule => rule.id !== id));
    toast.success('Location rule deleted');
  };

  const addHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error('Please fill in all holiday fields');
      return;
    }

    const holiday: Holiday = {
      id: Date.now().toString(),
      name: newHoliday.name,
      date: newHoliday.date,
      isActive: true
    };

    setHolidays([...holidays, holiday]);
    setNewHoliday({});
    toast.success('Holiday added successfully');
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays(holidays => 
      holidays.map(holiday => holiday.id === id ? { ...holiday, ...updates } : holiday)
    );
  };

  const deleteHoliday = (id: string) => {
    setHolidays(holidays => holidays.filter(holiday => holiday.id !== id));
    toast.success('Holiday deleted');
  };

  const getTierColor = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Settings</h1>
          <p className="text-muted-foreground">
            Configure delivery tiers, location rules, and pricing
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tiers">Delivery Tiers</TabsTrigger>
          <TabsTrigger value="locations">Location Rules</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Delivery Tiers Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Delivery Tiers Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Tiers */}
              <div className="space-y-4">
                {deliveryTiers.map((tier) => (
                  <Card key={tier.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div>
                          <Label>Tier Name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) => updateDeliveryTier(tier.id, { name: e.target.value })}
                            placeholder="Tier name"
                          />
                        </div>
                        <div>
                          <Label>Min Days</Label>
                          <Input
                            type="number"
                            value={tier.minDays}
                            onChange={(e) => updateDeliveryTier(tier.id, { minDays: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Max Days</Label>
                          <Input
                            type="number"
                            value={tier.maxDays}
                            onChange={(e) => updateDeliveryTier(tier.id, { maxDays: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Select 
                            value={tier.color} 
                            onValueChange={(value) => updateDeliveryTier(tier.id, { color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="gray">Gray</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={tier.isActive}
                            onCheckedChange={(checked) => updateDeliveryTier(tier.id, { isActive: checked })}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTierColor(tier.color)}>
                            {tier.minDays}-{tier.maxDays} days
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDeliveryTier(tier.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Add New Tier */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">Add New Delivery Tier</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <Label>Tier Name</Label>
                      <Input
                        value={newTier.name || ''}
                        onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                        placeholder="e.g., Super Express"
                      />
                    </div>
                    <div>
                      <Label>Min Days</Label>
                      <Input
                        type="number"
                        value={newTier.minDays || ''}
                        onChange={(e) => setNewTier({ ...newTier, minDays: parseInt(e.target.value) })}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Max Days</Label>
                      <Input
                        type="number"
                        value={newTier.maxDays || ''}
                        onChange={(e) => setNewTier({ ...newTier, maxDays: parseInt(e.target.value) })}
                        placeholder="2"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Select 
                        value={newTier.color || ''} 
                        onValueChange={(value) => setNewTier({ ...newTier, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="gray">Gray</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addDeliveryTier}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Rules Tab */}
        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location-Based Delivery Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Rules */}
              <div className="space-y-4">
                {locationRules.map((rule) => (
                  <Card key={rule.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <Label>Type</Label>
                          <Select 
                            value={rule.type} 
                            onValueChange={(value) => updateLocationRule(rule.id, { type: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="district">District</SelectItem>
                              <SelectItem value="city">City</SelectItem>
                              <SelectItem value="pincode">Pincode</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Value</Label>
                          <Input
                            value={rule.value}
                            onChange={(e) => updateLocationRule(rule.id, { value: e.target.value.toLowerCase() })}
                            placeholder="Location name or pincode"
                          />
                        </div>
                        <div>
                          <Label>Delivery Tier</Label>
                          <Select 
                            value={rule.tier.toString()} 
                            onValueChange={(value) => updateLocationRule(rule.id, { tier: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryTiers.map((tier) => (
                                <SelectItem key={tier.id} value={tier.id.toString()}>
                                  Tier {tier.id} - {tier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => updateLocationRule(rule.id, { isActive: checked })}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteLocationRule(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Add New Rule */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">Add New Location Rule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={newRule.type || ''} 
                        onValueChange={(value) => setNewRule({ ...newRule, type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="district">District</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="pincode">Pincode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input
                        value={newRule.value || ''}
                        onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                        placeholder="Location name or pincode"
                      />
                    </div>
                    <div>
                      <Label>Delivery Tier</Label>
                      <Select 
                        value={newRule.tier?.toString() || ''} 
                        onValueChange={(value) => setNewRule({ ...newRule, tier: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryTiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id.toString()}>
                              Tier {tier.id} - {tier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addLocationRule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Calculation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Date Calculation Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekend Adjustment</Label>
                    <p className="text-sm text-muted-foreground">
                      Add extra days for weekend orders
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableWeekendAdjustment}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableWeekendAdjustment: checked })
                    }
                  />
                </div>
                
                {settings.enableWeekendAdjustment && (
                  <div>
                    <Label>Weekend Extra Days</Label>
                    <Input
                      type="number"
                      value={settings.weekendExtraDays}
                      onChange={(e) => 
                        setSettings({ ...settings, weekendExtraDays: parseInt(e.target.value) })
                      }
                      min="0"
                      max="7"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Holiday Adjustment</Label>
                    <p className="text-sm text-muted-foreground">
                      Add extra days during holidays
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableHolidayAdjustment}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableHolidayAdjustment: checked })
                    }
                  />
                </div>

                {settings.enableHolidayAdjustment && (
                  <div>
                    <Label>Holiday Extra Days</Label>
                    <Input
                      type="number"
                      value={settings.holidayExtraDays}
                      onChange={(e) => 
                        setSettings({ ...settings, holidayExtraDays: parseInt(e.target.value) })
                      }
                      min="0"
                      max="7"
                    />
                  </div>
                )}

                <Separator />

                <div>
                  <Label>Default Delivery Tier</Label>
                  <Select 
                    value={settings.defaultTier.toString()} 
                    onValueChange={(value) => 
                      setSettings({ ...settings, defaultTier: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id.toString()}>
                          Tier {tier.id} - {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Restrict Delivery to State</Label>
                  <Input
                    value={settings.restrictToState}
                    onChange={(e) => 
                      setSettings({ ...settings, restrictToState: e.target.value })
                    }
                    placeholder="e.g., West Bengal"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing & Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Free Delivery Threshold ($)</Label>
                  <Input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => 
                      setSettings({ ...settings, freeDeliveryThreshold: parseFloat(e.target.value) })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Express Delivery</Label>
                    <p className="text-sm text-muted-foreground">
                      Offer paid express delivery option
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableExpressDelivery}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableExpressDelivery: checked })
                    }
                  />
                </div>

                {settings.enableExpressDelivery && (
                  <div>
                    <Label>Express Delivery Fee ($)</Label>
                    <Input
                      type="number"
                      value={settings.expressDeliveryFee}
                      onChange={(e) => 
                        setSettings({ ...settings, expressDeliveryFee: parseFloat(e.target.value) })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cash on Delivery (COD)</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow cash on delivery payments
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableCOD}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableCOD: checked })
                    }
                  />
                </div>

                {settings.enableCOD && (
                  <>
                    <div>
                      <Label>COD Fee ($)</Label>
                      <Input
                        type="number"
                        value={settings.codFee}
                        onChange={(e) => 
                          setSettings({ ...settings, codFee: parseFloat(e.target.value) })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Maximum COD Amount ($)</Label>
                      <Input
                        type="number"
                        value={settings.maxCodAmount}
                        onChange={(e) => 
                          setSettings({ ...settings, maxCodAmount: parseFloat(e.target.value) })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Holiday Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Holidays */}
              <div className="space-y-4">
                {holidays.map((holiday) => (
                  <Card key={holiday.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <Label>Holiday Name</Label>
                          <Input
                            value={holiday.name}
                            onChange={(e) => updateHoliday(holiday.id, { name: e.target.value })}
                            placeholder="Holiday name"
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={holiday.date}
                            onChange={(e) => updateHoliday(holiday.id, { date: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={holiday.isActive}
                            onCheckedChange={(checked) => updateHoliday(holiday.id, { isActive: checked })}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={holiday.isActive ? 'default' : 'secondary'}>
                            {new Date(holiday.date).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Add New Holiday */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">Add New Holiday</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label>Holiday Name</Label>
                      <Input
                        value={newHoliday.name || ''}
                        onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                        placeholder="e.g., Independence Day"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newHoliday.date || ''}
                        onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                      />
                    </div>
                    <Button onClick={addHoliday}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Holiday
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Configuration */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Configuration</h4>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium mb-2">Delivery Tiers</h5>
                      <div className="space-y-2">
                        {deliveryTiers.filter(t => t.isActive).map((tier) => (
                          <div key={tier.id} className="flex items-center justify-between">
                            <span className="text-sm">Tier {tier.id} - {tier.name}</span>
                            <Badge className={getTierColor(tier.color)}>
                              {tier.minDays}-{tier.maxDays} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium mb-2">Active Location Rules</h5>
                      <div className="space-y-1 text-sm">
                        {locationRules.filter(r => r.isActive).slice(0, 5).map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between">
                            <span>{rule.type}: {rule.value}</span>
                            <Badge variant="outline">Tier {rule.tier}</Badge>
                          </div>
                        ))}
                        {locationRules.filter(r => r.isActive).length > 5 && (
                          <p className="text-muted-foreground">
                            +{locationRules.filter(r => r.isActive).length - 5} more rules
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Settings Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Settings Summary</h4>
                  
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weekend Adjustment</span>
                        <div className="flex items-center gap-2">
                          {settings.enableWeekendAdjustment ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {settings.enableWeekendAdjustment ? `+${settings.weekendExtraDays} days` : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Holiday Adjustment</span>
                        <div className="flex items-center gap-2">
                          {settings.enableHolidayAdjustment ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {settings.enableHolidayAdjustment ? `+${settings.holidayExtraDays} days` : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Free Delivery Threshold</span>
                        <span className="text-sm font-medium">${settings.freeDeliveryThreshold}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Express Delivery</span>
                        <div className="flex items-center gap-2">
                          {settings.enableExpressDelivery ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {settings.enableExpressDelivery ? `$${settings.expressDeliveryFee}` : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cash on Delivery</span>
                        <div className="flex items-center gap-2">
                          {settings.enableCOD ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {settings.enableCOD ? `$${settings.codFee} fee` : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium mb-2">Active Holidays</h5>
                      <div className="space-y-1 text-sm">
                        {holidays.filter(h => h.isActive).map((holiday) => (
                          <div key={holiday.id} className="flex items-center justify-between">
                            <span>{holiday.name}</span>
                            <span className="text-muted-foreground">
                              {new Date(holiday.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {holidays.filter(h => h.isActive).length === 0 && (
                          <p className="text-muted-foreground">No active holidays</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}