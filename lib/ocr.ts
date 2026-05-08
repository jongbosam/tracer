/**
 * OCR Validation Logic integration point.
 * 
 * In a real application, you would:
 * 1. Convert the Canvas drawing data (dataURL/blob) to a format acceptable by Google Cloud Vision.
 * 2. Send the image to the Vision API (`https://vision.googleapis.com/v1/images:annotate`).
 * 3. Receive the bounding boxes and text.
 * 4. Map the bounding boxes to the CSS Grid coordinates to figure out which character belongs to which cell.
 * 5. Compare the parsed character with the `originalCharacters` array.
 */

export async function processOCR(
    canvasDataUrl: string, 
    originalCharacters: string[]
): Promise<{ results: (boolean | null)[], accuracy: number, errorCount: number }> {
    
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

    let errorCount = 0;
    let totalTargetChars = 0;
    const results: (boolean | null)[] = originalCharacters.map((expectedChar, index) => {
        // Skip empty cells
        if (!expectedChar.trim()) return null;
        
        totalTargetChars++;
        
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        
        // Define bounding box for the cell
        // We will add a small margin (e.g. 15%) so it doesn't count strokes that barely cross the border
        // or just tiny dots
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
                
                // If it's not mostly transparent, it has ink
                if (alpha > 5) {
                    inkPixels++;
                }
            }
        }

        // We require a minimum amount of ink to count the cell as "written"
        // Using a fixed low absolute number of pixels is safer than a percentage
        // if user draws thin strokes
        const minPixels = 10; // Require just a small stroke to exist

        const isError = inkPixels < minPixels; 
        
        if (isError) {
            errorCount++;
            return false; // Wrong / Unwritten
        }
        return true; // Correct
    });

    const accuracy = totalTargetChars > 0 
        ? Math.round(((totalTargetChars - errorCount) / totalTargetChars) * 100) 
        : 100;

    return {
        results,
        accuracy,
        errorCount
    };
}
