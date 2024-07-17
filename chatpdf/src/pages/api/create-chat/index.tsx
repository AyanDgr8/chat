// src/app/api/create-chat/route.ts


import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getFirebaseUrl, uploadFileToFirebase } from "@/lib/firebase";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
 
type ResponseData = {
  message?: string;
  error?: string;
  chat_id?: string;
}

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     // Process a POST request
//     console.log("nonu", req)
//     res.status(200).json({ message: req.method })

//   } else {
//     // Handle any other HTTP method
//   }
// }


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // console.log("nonu", req );
  if (req.method === 'POST') {
    // debugger

    try {

      // 
      const body = await req.body;
      const { file_key, file_name, userId } = body; // Ensure you send the correct file data
      
      if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      console.log("Received file:", file_key);
  
      // Step 1: Upload file to Firebase Storage
      let firebaseFileKey, firebaseFileName;
      // try {
      //   const response = await uploadFileToFirebase(file, { userId });
      //   firebaseFileKey = response.file_key;
      //   firebaseFileName = response.file_name;
      //   console.log("File uploaded to Firebase:", response);
      // } catch (error) {
      //   console.error("Error uploading file to Firebase:", error);
      //   return NextResponse.json(
      //     { error: "Failed to upload file to Firebase" },
      //     { status: 500 }
      //   );
      // }
  
      // Step 2: Load PDF into Pinecone
      try {
        await loadS3IntoPinecone(file_key);
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
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: getFirebaseUrl(file_key),
            userId,
            // Add any other relevant metadata here if needed
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

//   res.status(200).json({ message: 'Hello from Next.js!' })
}

