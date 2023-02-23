import * as React from "react";
import Paper from "@mui/material/Paper";
import { firebaseDataContext } from "../../context/FirebaseDataContext";
import { Web3Context } from "../../context/Web3Context";
import { useNavigate } from "react-router-dom";
import Chip from "@mui/material/Chip";
import Iconify from "../utils/Iconify";
import Tooltip from "@mui/material/Tooltip";

export default function Certificates() {
  const navigate = useNavigate();

  const fireDataContext = React.useContext(firebaseDataContext);
  const { getNFTCollections, certificatesData, generateClaimersExcellSheet } =
    fireDataContext;

  const web3Context = React.useContext(Web3Context);
  const { user } = web3Context;

  const [certificates, setCertificates] = React.useState([]);

  React.useEffect(() => {
    getNFTCollections(user?.addr);
  }, [user]);

  React.useEffect(() => {
    setCertificates(certificatesData);
  }, [certificatesData]);


  return (
    <>
      {certificates.map((item, i) => {
        return (
          <div
            key={i}
            className="col-lg-3 col-md-4 col-sm-6 col-12"
          >
            <Paper className="certificatesCard">
              <img
                className="certificate"
                src={item?.ipfsUrl}
                alt={item.name}
              />

              <span className="certificateDescription"> {item.name}</span>
              <span className="optionspan">
                <Chip
                  label={item.issueDate}
                  color="primary"
                  variant="outlined"
                />
                <Tooltip title="Download">
                  <Iconify
                    icon="mdi:download-circle-outline"
                    width={30}
                    height={30}
                    onClick={(e) => {
                      e.stopPropagation();
                      generateClaimersExcellSheet(item.name);
                    }}
                  />
                </Tooltip>
              </span>
            </Paper>
          </div>
        );
      })}
    </>
  );
}
