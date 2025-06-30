'use client';

import { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface DeliveryDetails {
  dayRangeText: string;
  minDateFormatted: string;
  maxDateFormatted: string;
}

interface LocationData {
  pincode: string;
  locationName: string;
  deliveryTier: number;
  deliveryMessage: string;
}

export function DeliveryEstimator() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [error, setError] = useState('');

  // Tier definitions
  const tier1Districts = ['howrah', 'kolkata', 'hooghly', 'north 24 parganas'];
  const tier2Cities = ['durgapur', 'asansol', 'bardhaman', 'kharagpur', 'haldia', 'midnapore'];
  const tierDays = {
    1: { min: 2, max: 3, text: '2-3 Day' },
    2: { min: 3, max: 4, text: '3-4 Day' },
    3: { min: 4, max: 6, text: '4-6 Day' }
  };

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const calculateDeliveryDetails = (minDays: number, maxDays: number): DeliveryDetails => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
    
    // Adjust for weekends
    let textMinDays = minDays;
    let textMaxDays = maxDays;

    if (dayOfWeek === 6 || dayOfWeek === 0) {
      textMinDays += 2;
      textMaxDays += 2;
    }

    const dayRangeText = `${textMinDays}-${textMaxDays} days`;
    
    // Calculate delivery dates
    const minDeliveryDate = new Date();
    minDeliveryDate.setDate(today.getDate() + textMinDays);

    const maxDeliveryDate = new Date();
    maxDeliveryDate.setDate(today.getDate() + textMaxDays);

    const formatDate = (date: Date) => 
      date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return {
      dayRangeText,
      minDateFormatted: formatDate(minDeliveryDate),
      maxDateFormatted: formatDate(maxDeliveryDate)
    };
  };

  const loadSavedLocation = () => {
    const savedPincode = localStorage.getItem('userPincode');
    const savedLocationName = localStorage.getItem('userLocationName');
    const savedTier = localStorage.getItem('userDeliveryTier');
    const savedMessage = localStorage.getItem('userDeliveryMessage');

    if (savedPincode && savedLocationName && savedTier) {
      const locationData: LocationData = {
        pincode: savedPincode,
        locationName: savedLocationName,
        deliveryTier: parseInt(savedTier, 10),
        deliveryMessage: savedMessage || ''
      };
      setLocationData(locationData);
      
      const days = tierDays[locationData.deliveryTier as keyof typeof tierDays];
      const details = calculateDeliveryDetails(days.min, days.max);
      setDeliveryDetails(details);
    } else {
      // Default to West Bengal with tier 3
      const defaultLocationData: LocationData = {
        pincode: '',
        locationName: 'West Bengal',
        deliveryTier: 3,
        deliveryMessage: '4-6 Day'
      };
      setLocationData(defaultLocationData);
      
      const days = tierDays[3];
      const details = calculateDeliveryDetails(days.min, days.max);
      setDeliveryDetails(details);
    }
  };

  const checkPincode = async () => {
    if (!pincodeInput || !/^\d{6}$/.test(pincodeInput.trim())) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput.trim()}`);
      
      if (!response.ok) {
        throw new Error('Network response error');
      }

      const data = await response.json();
      
      if (!data || data[0].Status !== 'Success') {
        throw new Error('Pincode not found');
      }

      const postOffice = data[0].PostOffice[0];
      const locationName = `${postOffice.Name}, ${postOffice.District}`;
      
      if (postOffice.State !== 'West Bengal') {
        setError('Sorry, we only deliver within West Bengal.');
        return;
      }

      const district = postOffice.District.toLowerCase();
      const city = postOffice.Name.toLowerCase();
      
      let determinedTier = 3;
      if (tier1Districts.includes(district)) {
        determinedTier = 1;
      } else if (tier2Cities.some(tier2City => city.includes(tier2City))) {
        determinedTier = 2;
      }

      const days = tierDays[determinedTier as keyof typeof tierDays];
      const deliveryDetails = calculateDeliveryDetails(days.min, days.max);
      
      const newLocationData: LocationData = {
        pincode: pincodeInput.trim(),
        locationName,
        deliveryTier: determinedTier,
        deliveryMessage: days.text
      };

      setLocationData(newLocationData);
      setDeliveryDetails(deliveryDetails);
      
      // Save to localStorage
      localStorage.setItem('userPincode', pincodeInput.trim());
      localStorage.setItem('userLocationName', locationName);
      localStorage.setItem('userDeliveryTier', determinedTier.toString());
      localStorage.setItem('userDeliveryMessage', days.text);
      
      setIsDialogOpen(false);
      setPincodeInput('');

    } catch (error) {
      console.error('Error checking pincode:', error);
      setError('Could not verify pincode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setPincodeInput('');
    setError('');
  };

  if (!locationData || !deliveryDetails) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4 space-y-3">
        {/* Free Delivery Info */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="font-medium text-green-800">Free Delivery to</span>
          <span className="text-green-700 font-semibold">{locationData.locationName}</span>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm underline ml-auto"
              >
                (Check another Pincode)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Check Delivery Location
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pincode">Enter your 6-digit Pincode</Label>
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="e.g., 700001"
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value);
                      setError('');
                    }}
                    maxLength={6}
                    className="mt-2"
                  />
                  {error && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={checkPincode} 
                    disabled={isLoading || !pincodeInput}
                    className="flex-1"
                  >
                    {isLoading ? 'Checking...' : 'Check Delivery'}
                  </Button>
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• We currently deliver only within West Bengal</p>
                  <p>• Delivery estimates may vary during festivals and weekends</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Delivery Time Estimate */}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-gray-700">Estimated delivery in</span>
          <span className="font-semibold text-blue-700">{deliveryDetails.dayRangeText}</span>
        </div>
        
        {/* Expected Delivery Dates */}
        <div className="flex items-center gap-3 text-sm">
          <Truck className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-gray-700">Expected between</span>
          <span className="font-semibold text-gray-900">{deliveryDetails.minDateFormatted}</span>
          <span className="text-gray-700">and</span>
          <span className="font-semibold text-gray-900">{deliveryDetails.maxDateFormatted}</span>
        </div>

        {/* Additional Info for Tier 1 locations */}
        {locationData.deliveryTier === 1 && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 p-2 rounded-md">
            <Check className="h-3 w-3" />
            <span>Express delivery available in your area!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}