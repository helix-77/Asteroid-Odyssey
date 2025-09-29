import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "neo_sample.json");
    const content = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(content);
    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      return NextResponse.json(
        { error: "NASA sample data file not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to read NASA sample data" },
      { status: 500 }
    );
  }
}
