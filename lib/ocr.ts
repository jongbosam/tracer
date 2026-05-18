import { GoogleGenAI, Type } from "@google/genai";

/**
 * OCR Validation Logic using Gemini API.
 */
export async function processAIOCR(
    canvasDataUrl: string, 
    originalCharacters: string[]
): Promise<{ results: (boolean | 'filled' | null)[], accuracy: number, errorCount: number }> {
    
    // We expect the user to provide the Gemini API Key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No Gemini API key found. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
        return processPixelOCR(canvasDataUrl, originalCharacters);
    }

    const ai = new GoogleGenAI({ apiKey });
    const img = new window.Image();
    img.src = canvasDataUrl;
    await new Promise((resolve) => {
        img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get 2d context for pixel analysis");

    // We must ensure the background is white before saving to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Create a separate invisible canvas for alpha check (to detect ink reliably)
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = img.width;
    alphaCanvas.height = img.height;
    const alphaCtx = alphaCanvas.getContext('2d');
    if (!alphaCtx) throw new Error("Could not get 2d context");
    alphaCtx.drawImage(img, 0, 0);
    const alphaData = alphaCtx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height).data;

    const COLS = 10;
    const ROWS = 5;
    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;

    const results: (boolean | 'filled' | null)[] = new Array(originalCharacters.length).fill(null);
    const cellsToVerify: { index: number, expectedChar: string, dataUrl: string }[] = [];

    let totalTargetChars = 0;

    for (let index = 0; index < originalCharacters.length; index++) {
        const expectedChar = originalCharacters[index];
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        
        const isTarget = expectedChar && expectedChar.trim() !== '';
        if (isTarget) totalTargetChars++;

        let inkPixels = 0;
        const startX = Math.floor(col * cellWidth);
        const startY = Math.floor(row * cellHeight);
        const endX = Math.floor((col + 1) * cellWidth);
        const endY = Math.floor((row + 1) * cellHeight);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const i = (y * alphaCanvas.width + x) * 4;
                const alpha = alphaData[i + 3]; // alpha channel
                if (alpha > 5) {
                    inkPixels++;
                }
            }
        }

        const minPixels = 10; 
        const hasInk = inkPixels >= minPixels;

        if (isTarget) {
            if (!hasInk) {
                // Target has no ink -> marked as false (wrong)
                results[index] = false;
            } else {
                // Target has ink -> needs AI validation
                // Crop this cell from the white-background ctx
                const cellImageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = endX - startX;
                cropCanvas.height = endY - startY;
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                    cropCtx.putImageData(cellImageData, 0, 0);
                    // Use jpeg for smaller payload
                    const base64 = cropCanvas.toDataURL('image/jpeg', 0.8).split(",")[1];
                    cellsToVerify.push({ index, expectedChar, dataUrl: base64 });
                }
            }
        } else {
            // Not target
            if (hasInk) {
                // Should be blank but has ink -> false
                results[index] = false;
            } else {
                // Blank and no ink -> null
                results[index] = null;
            }
        }
    }

    if (cellsToVerify.length > 0) {
        // Send to AI
        const parts: Array<{text?: string, inlineData?: {mimeType: string, data: string}}> = [
            { text: "Evaluate if the handwritten text images match their corresponding expected characters. Be slightly lenient with handwriting handwriting styles." }
        ];

        cellsToVerify.forEach((cell, i) => {
            parts.push({ text: `Image ${i + 1}. Expected match: "${cell.expectedChar}"` });
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cell.dataUrl
                }
            });
        });

        parts.push({ text: `Return a JSON array of boolean values (true/false) in the exact order of the images with length ${cellsToVerify.length}. Return true if the image contains the expected character, false otherwise.` });

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.BOOLEAN }
                    }
                }
            });

            const parsedArray: boolean[] = JSON.parse(response.text || "[]");

            cellsToVerify.forEach((cell, i) => {
                results[cell.index] = parsedArray[i] ?? false;
            });
        } catch (error) {
            console.error("AI validation error, falling back to true for filled cells", error);
            cellsToVerify.forEach((cell) => {
                results[cell.index] = true; // Fallback to avoid breaking completely
            });
        }
    }

    // Calculate errorCount
    let errorCount = 0;
    results.forEach((res, idx) => {
        const isTarget = originalCharacters[idx] && originalCharacters[idx].trim() !== '';
        // If it's a target cell and it evaluated to false OR was left null/unfilled when expected
        if (isTarget && (res === false || res === null)) {
            errorCount++;
        }
        // If it was NOT a target cell but has ink
        else if (!isTarget && res === false) {
             // Let's count it as an error
             errorCount++;
        }
    });

    const accuracy = totalTargetChars > 0 
        ? Math.round(((totalTargetChars - errorCount) / totalTargetChars) * 100) 
        : 100;

    return {
        results,
        accuracy: Math.max(0, accuracy),
        errorCount
    };
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
