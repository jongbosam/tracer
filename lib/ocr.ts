import { GoogleGenAI } from "@google/genai";

/**
 * OCR Validation Logic using Gemini API.
 */
export async function processAIOCR(
    canvasDataUrl: string, 
    originalCharacters: string[]
): Promise<{ results: (boolean | null)[], accuracy: number, errorCount: number }> {
    
    // We expect the user to provide the Gemini API Key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No Gemini API key found. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
        return processPixelOCR(canvasDataUrl, originalCharacters);
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64ImageData = canvasDataUrl.split(',')[1];
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: {
                parts: [
                    {
                        text: `This image contains a user's handwritten strokes corresponding to a 10 cols x 5 rows grid (the grid lines themselves are not drawn, just the ink strokes).
The original text to trace mapped to each of the 50 cells from left-to-right, top-to-bottom is provided below. An empty string "" means the cell should be blank.

Original cells:
${JSON.stringify(originalCharacters)}

Task: Evaluate the handwritten text in the image cell by cell. For each cell:
- if the expected cell is "" and the user drew nothing there, return "null".
- if the expected cell is "" but the user drew something there, return "false".
- if the expected cell has a character and the user correctly drew it (with reasonable handwriting tolerance), return "true".
- if the expected cell has a character but the user drew a completely wrong character or left it empty, return "false".

Return a JSON array of length 50 containing ONLY the strings "true", "false", or "null".`
                    },
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: "image/png"
                        }
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonStr = response.text?.trim() || "[]";
        const parsedArray: string[] = JSON.parse(jsonStr);

        let errorCount = 0;
        let totalTargetChars = 0;

        const results: (boolean | null)[] = parsedArray.map((val, index) => {
            const expectedChar = originalCharacters[index];
            const isTarget = expectedChar && expectedChar.trim() !== '';
            if (isTarget) {
                totalTargetChars++;
            }

            if (val === "null") return null;
            if (val === "false") {
                if (isTarget) errorCount++;
                return false;
            }
            if (val === "true") {
                // if it wasn't a target, but evaluated to true (shouldn't happen based on prompt), count as false
                if (!isTarget) return false;
                return true;
            }
            return null;
        });

        const accuracy = totalTargetChars > 0 
            ? Math.round(((totalTargetChars - errorCount) / totalTargetChars) * 100) 
            : 100;

        return {
            results,
            accuracy,
            errorCount
        };

    } catch (e) {
        console.error("Gemini API OCR failed:", e);
    }

    // Fallback
    console.log("Falling back to processPixelOCR...");
    return processPixelOCR(canvasDataUrl, originalCharacters);
}

export async function processPixelOCR(
    canvasDataUrl: string, 
    originalCharacters: string[]
): Promise<{ results: (boolean | 'filled' | null)[], accuracy: number, errorCount: number }> {
    // Create an image from the data URL to inspect pixel data
    const img = new window.Image();
    img.src = canvasDataUrl;
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error("Could not get 2d context for OCR validation");
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const COLS = 10;
    const ROWS = 5;
    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;

    const results: (boolean | 'filled' | null)[] = originalCharacters.map((expectedChar, index) => {
        // Skip empty cells
        if (!expectedChar.trim()) return null;
        
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        
        const marginX = cellWidth * 0.20;
        const marginY = cellHeight * 0.20;
        const startX = Math.floor(col * cellWidth + marginX);
        const startY = Math.floor(row * cellHeight + marginY);
        const endX = Math.floor((col + 1) * cellWidth - marginX);
        const endY = Math.floor((row + 1) * cellHeight - marginY);

        let inkPixels = 0;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const i = (y * canvas.width + x) * 4;
                const alpha = data[i + 3]; // alpha channel
                
                if (alpha > 5) {
                    inkPixels++;
                }
            }
        }

        const minPixels = 10; 
        const isFilled = inkPixels >= minPixels; 
        
        if (isFilled) {
            return 'filled'; 
        }
        return null; // Don't mark it wrong instantly, just not filled.
    });

    return {
        results,
        accuracy: 100, // Pixel OCR real-time doesn't judge accuracy
        errorCount: 0
    };
}
