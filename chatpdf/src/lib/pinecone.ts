// src/lib/pinecone.ts

import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromFirebase } from "./firebase";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(fileKey: string) {
  // 1. Download the PDF from Firebase
  console.log("Downloading PDF from Firebase...");
  const fileName = await downloadFromFirebase(fileKey);
  if (!fileName) {
    throw new Error("Could not download from Firebase.");
  }
  console.log("Loaded PDF into memory:", fileName);
  
  const loader = new PDFLoader(fileName);
  const pages = (await loader.load()) as PDFPage[];

  // 2. Split and segment the PDF
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. Vectorize and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  // 4. Upload to Pinecone
  const client = await getPineconeClient();
  const pineconeIndex = await client.index("chatpdf");
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  console.log("Inserting vectors into Pinecone...");
  await namespace.upsert(vectors);

  return documents[0]; // Returning the first document for reference
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
        // Add any additional metadata fields as necessary
      },
    } as PineconeRecord;
  } catch (error) {
    console.error("Error embedding document:", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, ""); // Clean up page content

  // Split the documents
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
        // You can add more metadata fields if needed
      },
    }),
  ]);

  return docs;
}
