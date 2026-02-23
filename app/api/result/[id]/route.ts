import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    try {
        // Read result from JSON file
        const resultPath = path.join(process.cwd(), "public", "output", id, "result.json");
        const resultData = await readFile(resultPath, "utf-8");
        const result = JSON.parse(resultData);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: "Video not found" },
            { status: 404 }
        );
    }
}
