import { getDoc } from "firebase/firestore";
import React, { useState, createContext, useEffect } from "react";

import {
  collection,
  addDoc,
  db,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "../firebase";
import Iconify from "../components/utils/Iconify";

import axios from "axios";

export const firebaseDataContext = createContext(undefined);

export const FirebaseDataContextProvider = (props) => {
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [rowsIssuer, setRowsIssuer] = useState([]);
  const [rowsCollection, setRowsCollection] = useState([]);
  const [badgesData, setBadgesData] = useState([]);
  const [certificatesData, setCertificates] = useState([]);
  const [claim, setClaim] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [claimer, setClaimer] = useState();

  function createDataCollector(
    claimToken,
    tokenId,
    claimerAddress,
    ipfsurl,
    name,
    title,
    claimed,
    type,
    transferable
  ) {
    return {
      claimToken,
      tokenId,
      claimerAddress,
      ipfsurl,
      name,
      title,
      claimed,
      type,
      transferable,
    };
  }
  function createDataCollection(
    name,
    description,
    issueDate,
    expireDate,
    type,
    ipfsUrl
  ) {
    return {
      name,
      description,
      issueDate,
      expireDate,
      type,
      ipfsUrl,
    };
  }

  useEffect(() => {
    getIssuers();
  }, []);

  async function addCollection(data) {
    setLoading(true);
    await addDoc(collection(db, "Collections"), {
      userId: data.userId,
      name: data.title,
      description: data.description,
      issueDate: new Date(),
      type: data.type,
      transferable: data.transferable,
      image: data.image,
    });

    setLoading(false);
    setUpdated(!updated);
  }

  async function addCollectors(data) {
    setLoading(true);
    await addDoc(collection(db, "Collectors"), {
      claimToken: data.token,
      tokenId: data.tokenId,
      claimerAddress: data.claimerAddress,
      ipfsurl: data.ipfsurl,
      name: data.name,
      claimed: data.claimed,
      type: data.type,
      transferable: data.transferable,
      title: data.title,
    });
    setLoading(false);
    setUpdated(!updated);
  }

  async function updateCollectors(data) {
    const collectorRef = doc(db, "Collectors", data.id);
    await updateDoc(collectorRef, {
      claimerAddress: data.claimerAddress,
      claimed: data.claimed,
    });
  }

  async function getCollections(userId) {
    try {
      const collections = query(
        collection(db, "Collections"),
        where("userId", "==", userId)
      );

      const collectionSnapshot = await getDocs(collections);

      const collectionList = collectionSnapshot.docs.map((doc) => doc.data());

      setCollections(collectionList);
    } catch (error) {
      console.log(error);
    }
  }

  async function getClaimers(eventTitle) {
    console.log(eventTitle, "eventTitle");
    const arry = [];
    try {
      setLoading(true);
      const collectors = query(
        collection(db, "Collectors"),
        where("title", "==", eventTitle)
      );
      const collectorsSnapshot = await getDocs(collectors);
      collectorsSnapshot.forEach((e) => {
        arry.push(
          createDataCollector(
            e.data().claimToken,
            e.data().tokenId,
            e.data().claimerAddress,
            e.data().ipfsurl,
            e.data().name,
            e.data().title,
            e.data().claimed,
            e.data().type,
            e.data().transferable
          )
        );
      });
      setClaim(arry);
      setLoading(false);
      return arry;
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  async function generateClaimersExcellSheet(eventTitle) {
    let claimers = await getClaimers(eventTitle);

    var arr = [];
    for (let i = 0; i < claimers.length; i++) {
      arr.push([
        claimers[i].name,
        `http://localhost:3000/claim/${claimers[i].claimToken}`,
      ]);
    }
    var csv = "Name,ClaimUrl\n";
    //merge the data with CSV
    arr.forEach(function (row) {
      csv += row.join(",");
      csv += "\n";
    });
    var hiddenElement = document.createElement("a");
    hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    hiddenElement.target = "_blank";
    //provide the name for the CSV file to be downloaded
    hiddenElement.download = `${eventTitle}.csv`;
    hiddenElement.click();
  }

  async function getClaimer(claimToken) {
    try {
      setLoading(true);
      const q = query(
        collection(db, "Collectors"),
        where("claimToken", "==", claimToken)
      );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (fire) => {
        const d = await axios.get(fire.data().ipfsurl);
        d.data.image = d.data.image.replace(
          "ipfs://",
          "https://nftstorage.link/ipfs/"
        );
        d.data.type = fire.data().type;

        setClaimer(d.data);
      });
      setLoading(true);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  async function getIssuers(id) {
    // const arry = [];
    // const q = query(collection(db, "Collectors"),where("collectionContract", "==", id));
    // const querySnapshot = await getDocs(q);
    // querySnapshot.forEach(async (fire) => {
    //   arry.push(
    //     createDataIssuer(
    //       fire.data().Name,
    //       fire.data().UserName,
    //       fire.data().Address,
    //       fire.data().Bio
    //     )
    //   );
    //   setRowsIssuer(arry);
    // });
  }

  async function getNFTCollections(user) {
    const arryb = [];
    const arryc = [];
    const q = query(
      collection(db, "UserProfile"),
      where("Address", "==", user)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (fire) => {
      const qr = query(
        collection(db, "Collections"),
        where("userId", "==", fire.id)
      );
      const snap = await getDocs(qr);

      snap.forEach(async (e) => {
        let meta = await axios.get(
          `https://nftstorage.link/ipfs/${e.data().image}/metadata.json`
        );
        var date = new Date(e.data().issueDate.seconds * 1000);
        var dd = String(date.getDate()).padStart(2, "0");
        var mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
        var yyyy = date.getFullYear();

        date = mm + "/" + dd + "/" + yyyy;
        if (e.data().type == "badge") {
          arryb.push(
            createDataCollection(
              e.data().name,
              e.data().description,
              date,
              e.data().expireDate,
              e.data().type,

              meta.data.image.replace(
                "ipfs://",
                "https://nftstorage.link/ipfs/"
              )
            )
          );
        } else {
          arryc.push(
            createDataCollection(
              e.data().name,
              e.data().description,
              date,
              e.data().expireDate,
              e.data().type,
              meta.data.image.replace(
                "ipfs://",
                "https://nftstorage.link/ipfs/"
              )
            )
          );
        }

        setBadgesData(arryb);
        setCertificates(arryc);
      });
    });
  }

  async function getMyCollection(address) {
    setLoading(true);
    console.log(address?.toString().toLowerCase());

    var array = [];
    const q = query(
      collection(db, "Collectors"),
      where("claimerAddress", "==", address)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (fire) => {
      console.log(fire.data());
      if (fire.exists) {
        const d = await axios.get(fire.data().ipfsurl);

        d.data.type = fire.data().type;
        array.push(d.data);
      } else {
      }
      setMyCollection(array);
    });

    setLoading(false);
  }

  return (
    <firebaseDataContext.Provider
      value={{
        addCollection,
        getCollections,
        addCollectors,
        updateCollectors,
        updated,
        loading,
        collections,
        rowsIssuer,
        rowsCollection,
        badgesData,
        certificatesData,
        claim,
        claimer,
        getClaimers,
        getClaimer,
        getMyCollection,
        getNFTCollections,
        generateClaimersExcellSheet,
        myCollection,
      }}
      {...props}
    >
      {props.children}
    </firebaseDataContext.Provider>
  );
};
 