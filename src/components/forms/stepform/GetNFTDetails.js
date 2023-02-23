import {
  TextareaAutosize,
  TextField,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Button,
} from "@mui/material";
import { ethers } from "ethers";

import { toast } from "react-toastify";

import React, { useContext } from "react";
import { NFTStorageContext } from "../../../context/NFTStorageContext";

function GetNFTDetails() {
  const value = useContext(NFTStorageContext);
  const formdata = value.labelInfo.formData;
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col">
          <Stack spacing={3} sx={{ margin: "10px" }}>
            <p> Provide NFT certificate details</p>
            <TextField
              fullWidth
              label="Title"
              name="title"
              id="title"
              type="title"
              onChange={value.setFormdata("title")}
              value={formdata.title}
            />

            <TextField
              id="outlined-multiline-static"
              label="Description"
              multiline
              rows={4}
              onChange={value.setFormdata("description")}
              value={formdata.description}
            />
          </Stack>
        </div>
      </div>
    </div>
  );
}

export default GetNFTDetails;
