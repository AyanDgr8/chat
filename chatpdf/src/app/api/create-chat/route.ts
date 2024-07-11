// src/app/api/create-chat/route.ts

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getFirebaseUrl, uploadToFirebase, signInWithClerk } from "@/lib/firebase";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file } = body;

    // Step 1: Upload file to Firebase Storage
    await signInWithClerk(); // Ensure Firebase is authenticated

    const { file_key: firebaseFileKey, file_name: firebaseFileName } = await uploadToFirebase(file, {}, signInWithClerk); 

    // ... rest of the code remains the same ...