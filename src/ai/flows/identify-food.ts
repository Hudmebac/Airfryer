'use server';

/**
 * @fileOverview This file contains the Genkit flow for identifying food items from an image.
 *
 * - identifyFood - The main function to identify food and provide cooking instructions.
 * - IdentifyFoodInput - The input type for the identifyFood function.
 * - IdentifyFoodOutput - The output type for the identifyFood function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const IdentifyFoodInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the food photo.'),
});
export type IdentifyFoodInput = z.infer<typeof IdentifyFoodInputSchema>;

const IdentifyFoodOutputSchema = z.object({
  foodName: z.string().describe('The identified name of the food item.'),
  cookingTime: z.string().describe('The cooking time in minutes.'),
  cookingTemperatureCelsius: z.string().describe('The cooking temperature in Celsius.'),
});
export type IdentifyFoodOutput = z.infer<typeof IdentifyFoodOutputSchema>;

export async function identifyFood(input: IdentifyFoodInput): Promise<IdentifyFoodOutput> {
  return identifyFoodFlow(input);
}

const identifyFoodPrompt = ai.definePrompt({
  name: 'identifyFoodPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the food photo.'),
    }),
  },
  output: {
    schema: z.object({
      foodName: z.string().describe('The identified name of the food item.'),
      cookingTime: z.string().describe('The cooking time in minutes.'),
      cookingTemperatureCelsius: z.string().describe('The cooking temperature in Celsius.'),
    }),
  },
  prompt: `You are an expert chef specializing in air fryer cooking.

You will identify the food item in the photo and provide cooking instructions, including cooking time in minutes and temperature in Celsius.

Use the following as the primary source of information about the food.

Photo: {{media url=photoUrl}}

Respond with the food name, cooking time, and cooking temperature in Celsius.
`,
});

const identifyFoodFlow = ai.defineFlow<
  typeof IdentifyFoodInputSchema,
  typeof IdentifyFoodOutputSchema
>({
  name: 'identifyFoodFlow',
  inputSchema: IdentifyFoodInputSchema,
  outputSchema: IdentifyFoodOutputSchema,
}, async input => {
  const {output} = await identifyFoodPrompt(input);
  return output!;
});
