import React from "react";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  return (
    <iframe
      // src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`}
      src ={`https://firebasestorage.googleapis.com/v0/b/chatpdf-a0b74.appspot.com/o/uploads%2F1720970027025-pdf-trial.pdf?alt=media&token=d16d74e3-1783-4cf8-8bdf-fed161cd25a2`}
      className="w-full h-full"
    ></iframe>
  );
};

export default PDFViewer;
