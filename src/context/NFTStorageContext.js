import React, { useState, createContext, useEffect } from "react";
import { NFTStorage, File } from "nft.storage";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Web3Context } from "./Web3Context";

export const NFTStorageContext = createContext(undefined);

export const NFTStorageContextProvider = (props) => {
  const web3Context = React.useContext(Web3Context);
  const { createNFTCollecion, setLoadingState } = web3Context;
  const [uploading, setUploading] = useState(false);
  const [csvData, setCsvData] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [usernamePos, setUsernamePos] = useState({ x: 112, y: -171 });
  const [template, setTemplate] = useState("");

  const [labelInfo, setlabelInfo] = useState({
    formData: {
      title: "",
      description: "",
      expireDate: "",
      transferable: "off",
    },
  });

  const NFT_STORAGE_TOKEN = process.env.REACT_APP_NFT_STORAGE_TOKEN;
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const setFormdata = (prop) => (event) => {
    setlabelInfo({
      ...labelInfo,
      formData: { ...labelInfo.formData, [prop]: event.target.value },
    });
  };

  const createCertificateNFT = async () => {
    try {
      setLoadingState(true);

      var results = await Promise.all(
        csvData.map(async (data) => {
          if (previewUrl) {
            const input = document.getElementById("certificateX");
            var inputText = document.getElementById("certText");
            inputText.innerHTML = data.name;
            inputText.style.position = "absolute";
            inputText.style.color = "red";
            inputText.style.fontFamily = "Pinyon Script";
            inputText.style.fontSize = "24px";
            inputText.style.position = "absolute";
            inputText.style.transform =
              "translate( usernamePos.x,usernamePos.y)";

            var pdfBlob = await html2canvas(input).then(async (canvas) => {
              const imgData = canvas.toDataURL("image/png");
              const img = new Image(); // create a new image element
              img.src = imgData; // set the source of the image to the data URL
              const imageData = await fetch(imgData).then((r) => r.blob()); //

              var pdf;
              if (canvas.width > canvas.height) {
                pdf = new jsPDF("l", "mm", [canvas.width, canvas.height]);
              } else {
                pdf = new jsPDF("p", "mm", [canvas.height, canvas.width]);
              }

              pdf.addImage(img, "JPEG", 10, 30, canvas.width, canvas.height);

              const pdfBlob = pdf.output("blob");
              return { imageData, pdfBlob };
            });

            const imageFile = new File(
              [pdfBlob.imageData],
              `${data.name.replace(/ +/g, "")}.png`,
              {
                type: "image/png",
              }
            );
            const pdfFile = new File(
              [pdfBlob.pdfBlob],
              `${data.name.replace(/ +/g, "")}.pdf`,
              {
                type: "application/pdf",
              }
            );
            const metadata = await client.store({
              name: labelInfo.formData.title,
              description: labelInfo.formData.description,
              image: imageFile,
              pdf: pdfFile,
              claimer: data.name,
            });
            return metadata.ipnft;
          } else {
            const input = document.getElementById(template);

            document.getElementById("certName").innerHTML = data.name;
            document.getElementById("validity").innerHTML =
              labelInfo.formData.expireDate == ""
                ? "LifeTime"
                : labelInfo.formData.expireDate;
            var pdfBlob = await html2canvas(input).then(async (canvas) => {
              const imgData = canvas.toDataURL("image/png");
              const img = new Image(); // create a new image element
              img.src = imgData; // set the source of the image to the data URL
              const imageData = await fetch(imgData).then((r) => r.blob()); //

              var pdf;
              if (canvas.width > canvas.height) {
                pdf = new jsPDF("l", "mm", [canvas.width, canvas.height]);
              } else {
                pdf = new jsPDF("p", "mm", [canvas.height, canvas.width]);
              }

              pdf.addImage(
                imgData,
                "JPEG",
                10,
                30,
                canvas.width,
                canvas.height
              );

              const pdfBlob = pdf.output("blob");
              return { imageData, pdfBlob };
            });

            const imageFile = new File(
              [pdfBlob.imageData],
              `${data.name.replace(/ +/g, "")}.png`,
              {
                type: "image/png",
              }
            );
            const pdfFile = new File(
              [pdfBlob.pdfBlob],
              `${data.name.replace(/ +/g, "")}.pdf`,
              {
                type: "application/pdf",
              }
            );
            const metadata = await client.store({
              name: labelInfo.formData.title,
              description: labelInfo.formData.description,
              image: imageFile,
              pdf: pdfFile,
              claimer: data.name,
            });

            // console.log(metadata, "metadata");
            return metadata.ipnft;
          }
        })
      );
      if (results.length > 0) {
        await createNFTCollecion(
          {
            tokenUris: results,
          },
          labelInfo.formData,
          "certificate"
        );
        setLoadingState(false);
      }
    } catch (error) {
      console.log(error);
      setLoadingState(false);
    }
  };

  return (
    <NFTStorageContext.Provider
      value={{
        createCertificateNFT,
        uploading,
        labelInfo,
        csvData,
        setCsvData,
        setFormdata,
        handleClickOpen,
        handleClose,
        open,
        setUsernamePos,
        previewUrl,
        usernamePos,
        setPreviewUrl,
        template,
        setTemplate,
      }}
      {...props}
    >
      {props.children}
    </NFTStorageContext.Provider>
  );
};
