'use client';

import {IdentifyFoodOutput, identifyFood} from '@/ai/flows/identify-food';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {toast} from '@/hooks/use-toast';
import {CameraIcon, UploadIcon} from 'lucide-react';
import Image from 'next/image';
import {useRef, useState, useEffect, useCallback} from 'react';
import {useActionState} from 'react';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

async function handleIdentifyFood(prevState: any, formData: FormData) {
  const photoUrl = formData.get('photoUrl') as string;
  if (!photoUrl) {
    toast({
      title: 'Error',
      description: 'Please upload a photo of the food.',
    });
    return {message: 'Please upload a photo of the food.'};
  }

  try {
    const result = await identifyFood({photoUrl});
    return result;
  } catch (e: any) {
    toast({
      title: 'Error',
      description: e.message,
    });
    return {message: e.message};
  }
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [state, formAction] = useActionState(handleIdentifyFood, null);
  const [cookingInfo, setCookingInfo] = useState<IdentifyFoodOutput | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    if (state && state.foodName) {
      setCookingInfo(state);
    } else {
      setCookingInfo(null);
    }
  }, [state]);


  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const takeSnapshot = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    }
  }, []);


  const handleSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (imageUrl) {
      const formData = new FormData();
      formData.append('photoUrl', imageUrl);
      formAction(formData);
    } else {
      toast({
        title: 'Info',
        description: 'Please upload a photo of the food.',
      });
    }
  }, [imageUrl, formAction]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      <Card className="w-full max-w-3xl space-y-4 p-4 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Air Fryer Temp</CardTitle>
          <CardDescription className="text-muted-foreground">Take Photo or upload image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Section */}
            <div className="flex flex-col items-center space-y-2">
              {imageUrl ? (
                <Image src={imageUrl} alt="Uploaded Food" width={300} height={300} className="rounded-md shadow-md object-cover" />
              ) : (
                <>
                  <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                  <canvas ref={canvasRef} className="hidden" />
                  { !(hasCameraPermission) && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access to use this feature.
                      </AlertDescription>
                    </Alert>
                  )
                  }
                </>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-2">
                <Input
                  type="file"
                  id="photoUrl"
                  name="photoUrl"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="photoUrl">
                  <Button asChild variant="secondary">
                    <span className="flex items-center">
                      <UploadIcon className="h-4 w-4 mr-2" />
                      {imageUrl ? 'Change Image' : 'Upload Image'}
                    </span>
                  </Button>
                </label>

                {hasCameraPermission && !imageUrl && (
                  <Button type="button" variant="secondary" onClick={takeSnapshot}>
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                )}
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md px-4 py-2 font-medium"
                  disabled={!imageUrl}
                >
                  Get Cooking Instructions
                </Button>
              </form>
            </div>

            {/* Cooking Instructions Section */}
            {cookingInfo && cookingInfo.foodName ? (
              <div className="mt-6 md:mt-0">
                <h2 className="text-lg font-semibold text-foreground">Cooking Instructions</h2>
                <div className="space-y-2">
                  <p className="text-foreground"><span className="font-semibold">Food Name:</span> {cookingInfo.foodName}</p>
                  <p className="text-foreground"><span className="font-semibold">Cooking Time:</span> {cookingInfo.cookingTime}</p>
                  <p className="text-foreground"><span className="font-semibold">Temperature:</span> {cookingInfo.cookingTemperatureCelsius} °C</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 md:mt-0 flex items-center justify-center">
                {imageUrl && !cookingInfo?.foodName && (
                  <p className="text-muted-foreground">Getting cooking instructions...</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

