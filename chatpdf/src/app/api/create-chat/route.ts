// src/app/api/create-chat/route.ts

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getFirebaseUrl, uploadFileToFirebase } from "@/lib/firebase"; // Correct import
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  try {
    const { userId } = await auth(); // Get userId from Clerk auth
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file } = body; // Ensure you send the correct file data

    console.log("Received file:", file);

    // Step 1: Upload file to Firebase Storage
    let firebaseFileKey, firebaseFileName;
    try {
      const response = await uploadFileToFirebase(file, { userId });
      firebaseFileKey = response.file_key;
      firebaseFileName = response.file_name;
      console.log("File uploaded to Firebase:", response);
    } catch (error) {
      console.error("Error uploading file to Firebase:", error);
      return NextResponse.json(
        { error: "Failed to upload file to Firebase" },
        { status: 500 }
      );
    }

    // Step 2: Load PDF into Pinecone
    try {
      await loadS3IntoPinecone(firebaseFileKey);
      console.log("Loaded PDF into Pinecone successfully");
    } catch (loadError) {
      console.error(`Error loading S3 into Pinecone: ${loadError}`);
      return NextResponse.json(
        { error: "Failed to load S3 into Pinecone" },
        { status: 500 }
      );
    }

    // Step 3: Insert into database
    try {
      const chat_id = await db
        .insert(chats)
        .values({
          fileKey: firebaseFileKey,
          pdfName: firebaseFileName,
          pdfUrl: getFirebaseUrl(firebaseFileKey),
          userId,
        })
        .returning({
          insertedId: chats.id,
        });

      console.log("Inserted into database:", chat_id);

      return NextResponse.json(
        {
          chat_id: chat_id[0].insertedId,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error(`Error inserting into database: ${dbError}`);
      return NextResponse.json(
        { error: "Failed to insert into database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error in POST request: ${error}`);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
