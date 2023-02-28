import html2canvas from "html2canvas";
import React, { useState, createContext } from "react";
import { NFTStorage, File } from "nft.storage";
import jsPDF from "jspdf";
import { Web3Context } from "./Web3Context";
export const BadgeContext = createContext(undefined);
export const BadgeContextProvider = (props) => {
  const [open, setOpen] = React.useState(false);
  const [uploadLogo, setLogo] = useState("");
  const [csvData, setCsvData] = React.useState([]);
  const [loading, setLoading] = useState(false);
  const web3Context = React.useContext(Web3Context);
  const { createNFTCollecion, setLoadingState } = web3Context;
  const NFT_STORAGE_TOKEN = process.env.REACT_APP_NFT_STORAGE_TOKEN;
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const [previewUrl, setPreviewUrl] = useState("");
  const [usernamePos, setUsernamePos] = useState({ x: 112, y: -171 });

  const [labelInfo, setlabelInfo] = useState({
    formData: {
      title: "",
      description: "",
      template: "",
      name: "",
      badgeName: "",
      transferable: "off",
    },
  });
  const handleChangeLogo = (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setLogo(url);
  };
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
  const createBadge = async () => {
    try {
      setLoadingState(true);

      var results = await Promise.all(
        csvData.map(async (data) => {
          if (previewUrl) {
            const input = document.getElementById("badgeId");
            input.style.width = "200px";
            input.style.height = "200px";

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
            const idd = `badgeToprint${labelInfo.formData.template}`;
            const input = document.getElementById(idd);

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
          "badge"
        );
        setLoadingState(false);
      }
    } catch (error) {
      console.log(error);
      setLoadingState(false);
    }
  };
  return (
    <BadgeContext.Provider
      value={{
        labelInfo,
        setFormdata,
        handleClickOpen,
        handleClose,
        open,
        handleChangeLogo,
        uploadLogo,
        csvData,
        setCsvData,
        loading,
        createBadge,
        setUsernamePos,
        previewUrl,
        usernamePos,
        setPreviewUrl,
      }}
      {...props}
    >
      {" "}
      {props.children}
    </BadgeContext.Provider>
  );
};
