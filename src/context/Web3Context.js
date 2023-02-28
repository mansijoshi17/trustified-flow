import React, { createContext, useEffect, useState } from "react";
import { collection, db, getDocs, query, where } from "../firebase";
import { toast } from "react-toastify";
import { firebaseDataContext } from "./FirebaseDataContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as fcl from "@onflow/fcl";
import { serverAuthorization } from "../actions/auth/authorization";
import "../flow/config";

export const Web3Context = createContext(undefined);

export const Web3ContextProvider = (props) => {
  const [address, setAddress] = useState();
  const [update, setUpdate] = useState(false);
  const [data, setData] = useState();
  const [userId, setUserId] = useState();
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimer, setClaimer] = useState({});
  const [aLoading, setaLoading] = useState(false);


  const [user, setUser] = useState({ loggedIn: false });
  const [list, setList] = useState([]);

  const [csvData, setCsvData] = useState([]);

  const firebasedatacontext = React.useContext(firebaseDataContext);
  const { addCollection, addCollectors, updateCollectors } =
    firebasedatacontext;

  useEffect(() => {
    getNFTs();
    getTokenIds();
  }, [user]);

  useEffect(() => {
    getFirestoreData(user?.addr);
  }, [user]);

  useEffect(() => {
    getFirestoreData(user?.addr);
  }, [update]);

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
  }, []);

  const shortAddress = (addr) =>
    addr.length > 10 && addr.startsWith("0x")
      ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
      : addr;

  const getFirestoreData = async (user) => {
    console.log(user);
    const q = query(
      collection(db, "UserProfile"),
      where("Address", "==", user)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((fire) => {
      setData(fire.data());
      setUserId(fire.id);
    });
  };

  function generateClaimToken(length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678910";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async function mintNFTs(recipient, tname, tdescription, uris) {
    const name = tname;
    const description = tdescription;
    const thumbnails = uris;
    try {
      const transactionId = await fcl.mutate({
        cadence: `
        import ExampleNFT from 0xDeployer
        import NonFungibleToken from 0xStandard
        
        transaction(name: String, description: String, thumbnails: [String], recipient: Address) {
          let RecipientCollection: &ExampleNFT.Collection{NonFungibleToken.CollectionPublic}
          
          prepare(signer: AuthAccount) {      
            self.RecipientCollection = getAccount(recipient).getCapability(ExampleNFT.CollectionPublicPath)
                                        .borrow<&ExampleNFT.Collection{NonFungibleToken.CollectionPublic}>()
                                        ?? panic("The recipient has not set up an ExampleNFT Collection yet.")
          }
        
          execute {
            ExampleNFT.emptyTokenIds()
            var i = 0
            while i < thumbnails.length {
              ExampleNFT.mintNFT(recipient: self.RecipientCollection, name: name, description: description, thumbnail: thumbnails[i])
              i = i + 1
            }
          }
        }
        `,
        args: (arg, t) => [
          arg(name, t.String),
          arg(description, t.String),
          arg(thumbnails, t.Array(t.String)),
          arg(recipient, t.Address),
        ],
        proposer: serverAuthorization,
        payer: serverAuthorization,
        authorizations: [serverAuthorization],
        limit: 999,
      });
      return transactionId;
    } catch (e) {
      console.log(e);
    }
  }

  const setLoadingState = (value) => {
    setaLoading(value);
  };

  const createNFTCollecion = async (data, firebasedata, type) => {
    setaLoading(true);
    try {
      let transactionId = await mintNFTs(
        user.addr,
        firebasedata.title,
        firebasedata.description,
        data.tokenUris
      );
      firebasedata.userId = userId;
      firebasedata.type = type;
      firebasedata.image = data.tokenUris[0];
      await addCollection(firebasedata);
      var array = [];

      fcl.tx(transactionId).subscribe(async (res) => {
        if (res.status === 4 && res.errorMessage === "") {
          let result = await getNFTs();
          let tokenIds = await getTokenIds();

          for (let i = 0; i < tokenIds.length; i++) {
            let obj = {};
            let claimToken = generateClaimToken(5);

            let r = result.filter((nft) => nft.id == tokenIds[i]);

            let d = await axios.get(
              `https://nftstorage.link/ipfs/${r[0].thumbnail.url}/metadata.json`
            );
            array.push([
              d.data.claimer,
              `http://localhost:3000/claim/${claimToken}`,
            ]);
            obj.title = firebasedata.title;
            obj.token = claimToken;
            obj.tokenId = parseInt(tokenIds[i]);
            obj.claimerAddress = "";
            obj.ipfsurl = `https://nftstorage.link/ipfs/${r[0].thumbnail.url}/metadata.json`;

            obj.name = d.data.claimer;
            obj.type = type;
            obj.claimed = "No";
            obj.transferable = firebasedata.transferable;

            await addCollectors(obj);
          }
          var csv = "Name,ClaimUrl\n";
          //merge the data with CSV
          array.forEach(function (row) {
            csv += row.join(",");
            csv += "\n";
          });
          var hiddenElement = document.createElement("a");
          hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
          hiddenElement.target = "_blank";
          //provide the name for the CSV file to be downloaded
          hiddenElement.download = `${firebasedata.title}.csv`;
          hiddenElement.click();

          setaLoading(false);
          toast.success("Successfully Issued NFT collection!!");
        }
      });
    } catch (err) {
      setaLoading(false);
      console.log(err);
      toast.error("Something want wrong!!", err);
    }
  };

  async function getTokenIds() {
    const result = await fcl.query({
      cadence: `
      import ExampleNFT from 0xDeployer
      import MetadataViews from 0xStandard

      pub fun main(): [UInt64] {
         return ExampleNFT.tokenIds
      }
      `,
      args: (arg, t) => [],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999,
    });

    console.log(result, "getTokenIds");
    return result;
  }

  async function getNFTs() {
    const address = user?.addr;
    const result = await fcl.query({
      cadence: `
      import ExampleNFT from 0xDeployer
      import MetadataViews from 0xStandard

      pub fun main(address: Address): [NFT] {
        let collection = getAccount(address).getCapability(ExampleNFT.CollectionPublicPath)
                          .borrow<&ExampleNFT.Collection{MetadataViews.ResolverCollection}>()
                          ?? panic("Could not borrow a reference to the collection")

        let ids = collection.getIDs()

        let answer: [NFT] = []

        for id in ids {
          // Get the basic display information for this NFT
          let nft = collection.borrowViewResolver(id: id)
          // Get the basic display information for this NFT
          let view = nft.resolveView(Type<MetadataViews.Display>())!
          let display = view as! MetadataViews.Display
          answer.append(
            NFT(
              id: id, 
              name: display.name, 
              description: display.description, 
              thumbnail: display.thumbnail
            )
          )
        }

        return answer
      }

      pub struct NFT {
        pub let id: UInt64
        pub let name: String 
        pub let description: String 
        pub let thumbnail: AnyStruct{MetadataViews.File}
        
        init(id: UInt64, name: String, description: String, thumbnail: AnyStruct{MetadataViews.File}) {
          self.id = id
          self.name = name 
          self.description = description
          self.thumbnail = thumbnail
        }
      }
      `,
      args: (arg, t) => [arg(address, t.Address)],
    });
    console.log(result, "ressss");
    setList(result);
    return result;
  }

  async function transferNFT(recipient, withdrawID) {
    console.log(recipient, withdrawID);
    const transactionId = await fcl.mutate({
      cadence: `
      import ExampleNFT from 0xDeployer
      import NonFungibleToken from 0xStandard

      transaction(recipient: Address, withdrawID: UInt64) {
        let ProviderCollection: &ExampleNFT.Collection{NonFungibleToken.Provider}
        let RecipientCollection: &ExampleNFT.Collection{NonFungibleToken.CollectionPublic}
        
        prepare(signer: AuthAccount) {
          self.ProviderCollection = signer.borrow<&ExampleNFT.Collection{NonFungibleToken.Provider}>(from: ExampleNFT.CollectionStoragePath)
                                      ?? panic("This user does not have a Collection.")

          self.RecipientCollection = getAccount(recipient).getCapability(ExampleNFT.CollectionPublicPath)
                                      .borrow<&ExampleNFT.Collection{NonFungibleToken.CollectionPublic}>()!
        }

        execute {
          self.RecipientCollection.deposit(token: <- self.ProviderCollection.withdraw(withdrawID: withdrawID))
        }
      }
      `,
      args: (arg, t) => [arg(recipient, t.Address), arg(withdrawID, t.UInt64)],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999,
    });

    console.log("Transaction Id", transactionId);
  }

  const claimCertificate = async (claimToken, claimerAddress) => {
    setClaimLoading(true);
    const q = query(
      collection(db, "Collectors"),
      where("claimToken", "==", claimToken)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (fire) => {
      try {
        console.log(claimerAddress, "claimerAddress");
        await transferNFT(claimerAddress, parseInt(fire.data().tokenId));
        setClaimer(fire.data());
        await updateCollectors({
          id: fire.id,
          claimerAddress: claimerAddress,
          claimed: "Yes",
        });
        toast.success("Claimed Certificate Successfully!");
        setClaimLoading(false);
      } catch (error) {
        toast.error("This certificate is already claimed!");
        setClaimLoading(false);
        console.log(error);
      }
    });
  };

  return (
    <Web3Context.Provider
      value={{
        createNFTCollecion,
        shortAddress,
        claimCertificate,
        getFirestoreData,
        claimLoading,
        setUpdate,
        getNFTs,
        setLoadingState,
        list,
        csvData,
        address,
        update,
        data,
        claimer,
        userId,
        aLoading,
        user,
      }}
      {...props}
    >
      {props.children}
    </Web3Context.Provider>
  );
};
