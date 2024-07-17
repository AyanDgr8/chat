// src/components/FileUpload.tsx
// src/components/FileUpload.tsx

"use client";

import { uploadFileToFirebase, useSignInWithClerk } from "@/lib/firebase";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; // Import useAuth from Clerk
// import { auth } from "@clerk/nextjs/server";

const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const isLoading = uploading;
  
  const { userId } = useAuth(); // Get the authenticated user
  const signInWithClerk = useSignInWithClerk();

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      console.log("ayan", file);
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        return;
      }
  
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId || "unknown", // Dynamically get the user ID
        },
      };
  
      try {
        setUploading(true);
        await signInWithClerk(); // Ensure user is signed in
        const data = await uploadFileToFirebase(file, metadata, signInWithClerk);
        if (!data?.file_key || !data?.file_name) {
          toast.error("Something went wrong");
          return;
        }
  
        // Directly initiate the API call without mutation
        const response = await axios.post("/api/create-chat", {
          file_key: data.file_key,
          file_name: data.file_name,
          userId: userId,
        });
  
        if (response.data.chat_id) {
          toast.success("Chat created!");
          router.push(`/chat/${response.data.chat_id}`); // Navigate to chat
        } else {
          toast.error("Error creating chat");
        }
      } catch (error) {
        console.log(error);
        toast.error("Error uploading file");
      } finally {
        setUploading(false);
      }
    },
  });
  
  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">
              Spilling Tea to GPT...
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
