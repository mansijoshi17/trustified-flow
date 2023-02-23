import {
  TextareaAutosize,
  TextField,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Box,
} from "@mui/material";
import { ethers } from "ethers";

import React, { useContext } from "react";
import { toast } from "react-toastify";
import { BadgeContext } from "../../context/BadgeContext";

function GetTitle() {
  const value = useContext(BadgeContext);
  const formdata = value.labelInfo.formData;
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  return (
    <div>
      <Stack spacing={3} sx={{ margin: "10px" }}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          id="title"
          type="title"
          onChange={value.setFormdata("title")}
          value={formdata.title}
        />
        <TextareaAutosize
          fullWidth
          name="description"
          id="description"
          type="text"
          label="Description"
          placeholder="Description"
          aria-label="minimum height"
          minRows={5}
          maxRows={6}
          onChange={value.setFormdata("description")}
          value={formdata.description}
        />
      </Stack>
    </div>
  );
}

export default GetTitle;
