// src/components/FileUpload.tsx

"use client";

import { uploadFileToFirebase, useSignInWithClerk } from "@/lib/firebase";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const signInWithClerk = useSignInWithClerk();

  const { mutate, status } = useMutation<
    { chat_id: string }, // Expected response type
    Error, 
    { file_key: string; file_name: string }
  >({
    mutationFn: async ({ file_key, file_name }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data; // Should return { chat_id }
    },
    onSuccess: (data) => {
      toast.success("Chat created!");
      router.push(`/chat/${data.chat_id}`); // Navigate to chat
    },
    onError: (err) => {
      toast.error("Error creating chat");
      console.error(err);
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        return;
      }

      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: "user_id", // Replace with actual user ID
        },
      };

      try {
        setUploading(true);
        await signInWithClerk();
        const data = await uploadFileToFirebase(file, metadata, signInWithClerk);
        if (!data?.file_key || !data?.file_name) {
          toast.error("Something went wrong");
          return;
        }
        mutate({ file_key: data.file_key, file_name: data.file_name });
      } catch (error) {
        console.log(error);
        toast.error("Error uploading file");
      } finally {
        setUploading(false);
      }
    },
  });

  const isLoading = uploading || status === 'pending';

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
